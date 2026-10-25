import type { Animal, Atendimento, AtendimentoAnimal, Insumo, Lote, Semen } from '#shared/types/entidades'

/**
 * Indicadores calculados no aparelho a partir do que a sincronização trouxe (funcionam sem internet):
 * estoque restante, painel da fazenda, ranking de touros, vacas-problema e partos previstos.
 * Taxas de prenhez só usam IATF finalizados: antes do D45 a prenhez ainda não é conhecida.
 */

const taxa = (parte: number, total: number) => (total ? Math.round((parte / total) * 1000) / 10 : null)
const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().replace(/\s+/g, ' ').trim()

function somarDias(data: string, dias: number) {
  const d = new Date(`${data}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}
const dataD10 = (a: Pick<Atendimento, 'dataD0' | 'dataD10'>) => a.dataD10 ?? somarDias(a.dataD0, 10)
const finalizado = (a: Atendimento) => a.tipo === 'dg_iatf' && a.status === 'finalizado'
// Linha que entrou no protocolo; antes de sincronizar, "vazia" num DG + IATF já entra
const emProtocolo = (l: AtendimentoAnimal, a: Atendimento) => l.emProtocolo ?? (a.tipo === 'dg_iatf' && l.situacaoDg === 'vazia')

// ---------- Estoque ----------

export interface SituacaoEstoque { restante: number, usado: number, baixo: boolean }

/** Doses de sêmen: contadas em estoqueEm, menos as inseminações com esse sêmen desde então (pelo D10). */
export function estoqueSemen(semen: Semen, atendimentos: Atendimento[], linhas: AtendimentoAnimal[]): SituacaoEstoque | null {
  if (semen.estoqueDoses === null || semen.estoqueDoses === undefined) return null
  const desde = semen.estoqueEm ?? '0000-01-01'
  const atendimentoDe = new Map(atendimentos.map(a => [a.id, a]))
  const usado = linhas.filter((l) => {
    const a = atendimentoDe.get(l.atendimentoId)
    return l.semenId === semen.id && l.inseminada === true && a && dataD10(a) >= desde
  }).length
  const restante = semen.estoqueDoses - usado
  return { restante, usado, baixo: restante <= (semen.estoqueMinimo ?? 0) }
}

/** Hormônio ou implante: saldo contado em saldoEm, menos usoPorVaca por vaca que entrou em protocolo desde então (pelo D0). */
export function estoqueInsumo(insumo: Insumo, atendimentos: Atendimento[], linhas: AtendimentoAnimal[]): SituacaoEstoque {
  const atendimentoDe = new Map(atendimentos.map(a => [a.id, a]))
  const vacas = insumo.usoPorVaca
    ? linhas.filter((l) => {
        const a = atendimentoDe.get(l.atendimentoId)
        return a && a.dataD0 >= insumo.saldoEm && emProtocolo(l, a)
      }).length
    : 0
  const usado = Math.round(vacas * (insumo.usoPorVaca ?? 0) * 100) / 100
  const restante = Math.round((insumo.saldo - usado) * 100) / 100
  return { restante, usado, baixo: restante <= (insumo.minimo ?? 0) }
}

// ---------- Painel da fazenda ----------

export interface ResultadoIatf { atendimentoId: string, data: string, lote: string, inseminador: string | null, inseminadas: number, prenhas: number, taxa: number | null }
export interface Agrupado { rotulo: string, iatf: number, inseminadas: number, prenhas: number, taxa: number | null }

/** Cada IATF finalizado da fazenda, em ordem de data, com a taxa de prenhez no D45. */
export function resultadosIatf(atendimentos: Atendimento[], lotes: Lote[]): ResultadoIatf[] {
  const nomeLote = new Map(lotes.map(l => [l.id, l.nome]))
  return atendimentos
    .filter(a => finalizado(a) && nomeLote.has(a.loteId) && a.resultado)
    .map(a => ({
      atendimentoId: a.id,
      data: a.dataD0,
      lote: nomeLote.get(a.loteId)!,
      inseminador: a.inseminador,
      inseminadas: a.resultado!.inseminadas,
      prenhas: a.resultado!.prenhasD45,
      taxa: taxa(a.resultado!.prenhasD45, a.resultado!.inseminadas),
    }))
    .sort((x, y) => x.data.localeCompare(y.data))
}

/** Soma os IATF por lote ou por inseminador e calcula a taxa do grupo (melhor primeiro). */
export function agrupar(resultados: ResultadoIatf[], chave: (r: ResultadoIatf) => string): Agrupado[] {
  const grupos = new Map<string, Agrupado>()
  for (const r of resultados) {
    const rotulo = chave(r)
    const g = grupos.get(rotulo) ?? { rotulo, iatf: 0, inseminadas: 0, prenhas: 0, taxa: null }
    g.iatf++
    g.inseminadas += r.inseminadas
    g.prenhas += r.prenhas
    grupos.set(rotulo, g)
  }
  return [...grupos.values()]
    .map(g => ({ ...g, taxa: taxa(g.prenhas, g.inseminadas) }))
    .sort((a, b) => (b.taxa ?? -1) - (a.taxa ?? -1) || b.inseminadas - a.inseminadas)
}

// ---------- Ranking de touros ----------

export interface Touro { nome: string, inseminadas: number, prenhas: number, taxa: number | null, fazendas: number }
export interface FiltroTouros { propriedadeId?: string, desde?: string, minimo?: number }

/**
 * Prenhez por touro juntando as fazendas: o sêmen é cadastrado por fazenda, então o mesmo touro
 * é reconhecido pelo nome (sem acento, maiúscula ou espaço sobrando).
 */
export function rankingTouros(
  semens: Semen[], lotes: Lote[], atendimentos: Atendimento[], linhas: AtendimentoAnimal[], filtro: FiltroTouros = {},
): Touro[] {
  const semenDe = new Map(semens.map(s => [s.id, s]))
  const propriedadeDoLote = new Map(lotes.map(l => [l.id, l.propriedadeId]))
  const atendimentoDe = new Map(atendimentos.filter(finalizado).map(a => [a.id, a]))
  const grupos = new Map<string, { nomes: Map<string, number>, inseminadas: number, prenhas: number, fazendas: Set<string> }>()
  for (const l of linhas) {
    const a = atendimentoDe.get(l.atendimentoId)
    const s = l.semenId ? semenDe.get(l.semenId) : undefined
    if (!a || !s || l.inseminada !== true || !l.resultadoD45) continue
    const propriedadeId = propriedadeDoLote.get(a.loteId)
    if (filtro.propriedadeId && propriedadeId !== filtro.propriedadeId) continue
    if (filtro.desde && a.dataD0 < filtro.desde) continue
    const chave = normalizar(s.nome)
    const g = grupos.get(chave) ?? { nomes: new Map(), inseminadas: 0, prenhas: 0, fazendas: new Set() }
    g.nomes.set(s.nome, (g.nomes.get(s.nome) ?? 0) + 1)
    g.inseminadas++
    if (l.resultadoD45 === 'prenha') g.prenhas++
    if (propriedadeId) g.fazendas.add(propriedadeId)
    grupos.set(chave, g)
  }
  return [...grupos.values()]
    .filter(g => g.inseminadas >= (filtro.minimo ?? 1))
    .map(g => ({
      // Mostra o nome escrito do jeito mais usado
      nome: [...g.nomes].sort((a, b) => b[1] - a[1])[0]![0],
      inseminadas: g.inseminadas,
      prenhas: g.prenhas,
      taxa: taxa(g.prenhas, g.inseminadas),
      fazendas: g.fazendas.size,
    }))
    .sort((a, b) => (b.taxa ?? -1) - (a.taxa ?? -1) || b.inseminadas - a.inseminadas)
}

// ---------- Vacas ----------

export interface ResumoReprodutivo { dgs: number, protocolos: number, inseminacoes: number, prenhezesD45: number, falhas: number, falhasSeguidas: number, taxa: number | null }

/**
 * Resumo da vaca em todos os atendimentos. Falha = entrou no protocolo e não emprenhou
 * (não foi inseminada ou ficou vazia no D45). "Seguidas" conta as últimas, sem prenhez no meio.
 */
export function resumoReprodutivo(passagens: { linha: AtendimentoAnimal, atendimento: Atendimento }[]): ResumoReprodutivo {
  const avaliadas = passagens.filter(p => p.linha.situacaoDg !== 'pendente')
  const protocolos = avaliadas
    .filter(p => emProtocolo(p.linha, p.atendimento) && finalizado(p.atendimento))
    .sort((a, b) => a.atendimento.dataD0.localeCompare(b.atendimento.dataD0))
  const falhou = (p: typeof protocolos[number]) => p.linha.inseminada === false || p.linha.resultadoD45 === 'vazia'
  let falhasSeguidas = 0
  for (let i = protocolos.length - 1; i >= 0 && falhou(protocolos[i]!); i--) falhasSeguidas++
  const inseminacoes = protocolos.filter(p => p.linha.inseminada === true).length
  const prenhezesD45 = protocolos.filter(p => p.linha.resultadoD45 === 'prenha').length
  return {
    dgs: avaliadas.length,
    protocolos: protocolos.length,
    inseminacoes,
    prenhezesD45,
    falhas: protocolos.filter(falhou).length,
    falhasSeguidas,
    taxa: taxa(prenhezesD45, inseminacoes),
  }
}

export interface VacaProblema { animalId: string, numero: string, lote: string, falhas: number, falhasSeguidas: number, protocolos: number }

/** Vacas da fazenda que falharam em 2 ou mais protocolos seguidos: candidatas a descarte ou a exame. */
export function vacasProblema(animais: Animal[], lotes: Lote[], atendimentos: Atendimento[], linhas: AtendimentoAnimal[], minimo = 2): VacaProblema[] {
  const nomeLote = new Map(lotes.map(l => [l.id, l.nome]))
  const atendimentoDe = new Map(atendimentos.map(a => [a.id, a]))
  const porAnimal = new Map<string, { linha: AtendimentoAnimal, atendimento: Atendimento }[]>()
  for (const l of linhas) {
    const a = atendimentoDe.get(l.atendimentoId)
    if (!a) continue
    porAnimal.set(l.animalId, [...(porAnimal.get(l.animalId) ?? []), { linha: l, atendimento: a }])
  }
  return animais
    .filter(v => nomeLote.has(v.loteId))
    .map((v) => {
      const r = resumoReprodutivo(porAnimal.get(v.id) ?? [])
      return { animalId: v.id, numero: v.numero, lote: nomeLote.get(v.loteId)!, falhas: r.falhas, falhasSeguidas: r.falhasSeguidas, protocolos: r.protocolos }
    })
    .filter(v => v.falhasSeguidas >= minimo)
    .sort((a, b) => b.falhasSeguidas - a.falhasSeguidas || a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true }))
}

// ---------- Partos ----------

export interface PartoPrevisto { animalId: string, numero: string, lote: string, data: string, origem: 'iatf' | 'dg' }
export interface MesDePartos { mes: string, partos: PartoPrevisto[] }

/**
 * Partos previstos da fazenda, por mês, a partir do mês atual. Usa a prenhez mais recente de cada vaca:
 * a do IATF (D10 + gestação, calculada no servidor) ou a previsão anotada no DG.
 */
export function partosPrevistos(animais: Animal[], lotes: Lote[], atendimentos: Atendimento[], linhas: AtendimentoAnimal[], hoje: string): MesDePartos[] {
  const nomeLote = new Map(lotes.map(l => [l.id, l.nome]))
  const atendimentoDe = new Map(atendimentos.map(a => [a.id, a]))
  const doIatf = new Map<string, { data: string, d0: string }>()
  for (const l of linhas) {
    const a = atendimentoDe.get(l.atendimentoId)
    if (!a?.previsaoParto || l.resultadoD45 !== 'prenha') continue
    const atual = doIatf.get(l.animalId)
    if (!atual || a.dataD0 > atual.d0) doIatf.set(l.animalId, { data: a.previsaoParto, d0: a.dataD0 })
  }
  const inicioDoMes = `${hoje.slice(0, 7)}-01`
  const partos: PartoPrevisto[] = []
  for (const v of animais) {
    if (!nomeLote.has(v.loteId)) continue
    // A previsão mais recente vale: uma prenhez de IATF antiga não esconde a anotada num DG depois
    const iatf = doIatf.get(v.id)?.data
    const dg = v.previsaoParto
    const data = iatf && (!dg || iatf >= dg) ? iatf : dg
    if (!data || data < inicioDoMes) continue
    partos.push({ animalId: v.id, numero: v.numero, lote: nomeLote.get(v.loteId)!, data, origem: data === iatf ? 'iatf' : 'dg' })
  }
  const meses = new Map<string, PartoPrevisto[]>()
  for (const p of partos.sort((a, b) => a.data.localeCompare(b.data))) meses.set(p.data.slice(0, 7), [...(meses.get(p.data.slice(0, 7)) ?? []), p])
  return [...meses].map(([mes, lista]) => ({ mes, partos: lista }))
}
