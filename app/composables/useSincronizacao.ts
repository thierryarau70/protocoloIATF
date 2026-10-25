import type { Table } from 'dexie'
import type { Entidade } from '#shared/esquemas'
import type { ResultadoOperacao, Snapshot } from '#shared/types/entidades'

const online = ref(true)
const sincronizando = ref(false)
const ultimaSincronizacao = ref<Date | null>(null)
const rejeitados = ref<string[]>([])
/** Por que a última tentativa de sincronizar falhou (sem conexão, sessão expirada, servidor fora); vazio quando deu certo */
const falha = ref('')
const { dados: pendentes } = useConsultaGlobal()

let tentativas = 0
let temporizador: ReturnType<typeof setTimeout> | undefined
let iniciado = false

function useConsultaGlobal() {
  return effectScope(true).run(() => useConsulta(() => 0, () => bancoLocal.fila.count(), 0))!
}

/**
 * Grava no aparelho e coloca na fila de envio, na mesma transação.
 * Os campos recebidos são mesclados com o registro atual do aparelho, então duas alterações
 * seguidas na mesma vaca não se sobrescrevem; a fila leva o registro completo.
 */
async function registrar<T extends { id: string }>(entidade: Entidade, dados: T): Promise<T> {
  const tabela = tabelaDaEntidade[entidade]
  let completo = dados
  await bancoLocal.transaction('rw', tabela, bancoLocal.fila, async () => {
    completo = { ...(await tabela.get(dados.id)), ...dados }
    await tabela.put(completo as never)
    await bancoLocal.fila.add({ entidade, registroId: dados.id, dados: { ...completo } })
  })
  agendar(0)
  return completo
}

function agendar(atraso: number) {
  clearTimeout(temporizador)
  temporizador = setTimeout(sincronizar, atraso)
}

async function enviarFila(): Promise<void> {
  for (;;) {
    const itens = await bancoLocal.fila.orderBy('seq').limit(100).toArray()
    if (!itens.length) return
    const { resultados } = await api<{ resultados: ResultadoOperacao[] }>('/api/sync', {
      method: 'POST',
      body: { operacoes: itens.map(i => ({ id: String(i.seq), entidade: i.entidade, dados: i.dados })) },
    })
    const erros = resultados.filter(r => !r.ok).map(r => r.erro ?? 'Registro recusado.')
    if (erros.length) rejeitados.value = [...rejeitados.value, ...erros]
    await bancoLocal.fila.bulkDelete(resultados.map(r => Number(r.id)))
  }
}

/** Substitui os dados do aparelho pelos do servidor, sem perder o que ainda está na fila. */
async function baixarDados(): Promise<void> {
  const snapshot = await api<Snapshot>('/api/sync')
  const tabelas: Record<keyof Snapshot, Table<{ id: string }, string>> = {
    propriedades: bancoLocal.propriedades,
    lotes: bancoLocal.lotes,
    semens: bancoLocal.semens,
    animais: bancoLocal.animais,
    atendimentos: bancoLocal.atendimentos,
    atendimentoAnimais: bancoLocal.atendimentoAnimais,
    insumos: bancoLocal.insumos,
  }
  await bancoLocal.transaction('rw', [...tabelasDeDados, bancoLocal.fila], async () => {
    const naFila = new Set((await bancoLocal.fila.toArray()).map(i => i.registroId))
    for (const chave of Object.keys(tabelas) as (keyof Snapshot)[]) {
      const tabela = tabelas[chave]
      const locais = await tabela.toCollection().primaryKeys()
      await tabela.bulkDelete(locais.filter(id => !naFila.has(id)))
      await tabela.bulkPut(snapshot[chave].filter(r => !naFila.has(r.id)))
    }
  })
}

async function sincronizar(): Promise<void> {
  if (sincronizando.value || !online.value) return
  sincronizando.value = true
  try {
    await enviarFila()
    await baixarDados()
    // Algo pode ter sido registrado durante o envio
    if (await bancoLocal.fila.count()) await enviarFila()
    tentativas = 0
    falha.value = ''
    ultimaSincronizacao.value = new Date()
  }
  catch (e) {
    const status = (e as { statusCode?: number })?.statusCode
    if (status === 401) {
      falha.value = 'Sua sessão expirou. Entre de novo para enviar o que está salvo neste aparelho.'
      return
    }
    tentativas++
    const espera = Math.min(60_000, 5_000 * 2 ** (tentativas - 1))
    const quando = `Tentando de novo em ${Math.round(espera / 1000)} s; nada se perde, está salvo no aparelho.`
    falha.value = eErroDeRede(e)
      ? `Sem conexão com o servidor. ${quando}`
      : `O servidor não conseguiu receber os dados agora${status ? ` (erro ${status})` : ''}. ${quando}`
    agendar(espera)
  }
  finally {
    sincronizando.value = false
  }
}

function iniciar() {
  if (iniciado || import.meta.server) return
  iniciado = true
  online.value = navigator.onLine
  window.addEventListener('online', () => {
    online.value = true
    agendar(0)
  })
  window.addEventListener('offline', () => { online.value = false })
  // Rede de segurança: tenta de novo a cada minuto enquanto houver pendências
  setInterval(() => {
    if (pendentes.value) agendar(0)
  }, 60_000)
  agendar(0)
}

export function useSincronizacao() {
  return {
    online: readonly(online),
    sincronizando: readonly(sincronizando),
    pendentes,
    ultimaSincronizacao: readonly(ultimaSincronizacao),
    rejeitados,
    falha: readonly(falha),
    registrar,
    sincronizar,
    iniciar,
    limparRejeitados: () => { rejeitados.value = [] },
  }
}
