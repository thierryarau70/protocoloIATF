import { and, eq, inArray, sql } from 'drizzle-orm'
import { esquemaOperacao, esquemas } from '#shared/esquemas'
import type { ResultadoOperacao, Snapshot } from '#shared/types/entidades'
import { calcularDatas, calcularResultado, normalizarLinhaAnimal, previsaoPartoIatf, validarLinhaAnimal } from './regras'
import { tabelas, useDb } from './db'

const { propriedade, lote, animal, atendimento, atendimentoAnimal } = tabelas

type Db = Awaited<ReturnType<typeof useDb>>
type Operacao = ReturnType<typeof esquemaOperacao.parse>

class ErroOperacao extends Error {}

async function lotePermitido(db: Db, vetId: string, loteId: string) {
  const [linha] = await db.select({ id: lote.id }).from(lote)
    .innerJoin(propriedade, eq(lote.propriedadeId, propriedade.id))
    .where(and(eq(lote.id, loteId), eq(propriedade.veterinarioId, vetId)))
  if (!linha) throw new ErroOperacao('Lote não encontrado.')
}

/** Garante que um registro já existente com este id pertence ao veterinário. */
async function exigirDono(db: Db, vetId: string, loteIdExistente: string | undefined) {
  if (loteIdExistente) await lotePermitido(db, vetId, loteIdExistente)
}

async function buscarAtendimento(db: Db, vetId: string, id: string) {
  const [linha] = await db.select().from(atendimento).where(eq(atendimento.id, id))
  if (!linha) throw new ErroOperacao('Atendimento não encontrado.')
  await lotePermitido(db, vetId, linha.loteId)
  return linha
}

const agora = sql`now()`

async function salvarPropriedade(db: Db, vetId: string, dados: unknown) {
  const p = esquemas.propriedade.parse(dados)
  const [existente] = await db.select({ veterinarioId: propriedade.veterinarioId }).from(propriedade).where(eq(propriedade.id, p.id))
  if (existente && existente.veterinarioId !== vetId) throw new ErroOperacao('Propriedade não encontrada.')
  await db.insert(propriedade).values({ ...p, veterinarioId: vetId })
    .onConflictDoUpdate({ target: propriedade.id, set: { ...p, atualizadoEm: agora } })
}

async function salvarLote(db: Db, vetId: string, dados: unknown) {
  const l = esquemas.lote.parse(dados)
  const [existente] = await db.select({ propriedadeId: lote.propriedadeId }).from(lote).where(eq(lote.id, l.id))
  for (const propriedadeId of new Set([existente?.propriedadeId, l.propriedadeId])) {
    if (!propriedadeId) continue
    const [dono] = await db.select({ id: propriedade.id }).from(propriedade)
      .where(and(eq(propriedade.id, propriedadeId), eq(propriedade.veterinarioId, vetId)))
    if (!dono) throw new ErroOperacao('Propriedade não encontrada.')
  }
  await db.insert(lote).values(l).onConflictDoUpdate({ target: lote.id, set: { ...l, atualizadoEm: agora } })
}

async function salvarAnimal(db: Db, vetId: string, dados: unknown) {
  const a = esquemas.animal.parse(dados)
  const [existente] = await db.select({ loteId: animal.loteId }).from(animal).where(eq(animal.id, a.id))
  await exigirDono(db, vetId, existente?.loteId)
  await lotePermitido(db, vetId, a.loteId)
  await db.insert(animal).values(a).onConflictDoUpdate({ target: animal.id, set: { ...a, atualizadoEm: agora } })
}

async function salvarAtendimento(db: Db, vetId: string, dados: unknown) {
  const at = esquemas.atendimento.parse(dados)
  if (at.tipo === 'so_dg' && at.status === 'protocolo') throw new ErroOperacao('Atendimento "Só DG" não tem protocolo IATF.')
  const [existente] = await db.select({ loteId: atendimento.loteId }).from(atendimento).where(eq(atendimento.id, at.id))
  await exigirDono(db, vetId, existente?.loteId)
  await lotePermitido(db, vetId, at.loteId)
  const valores = { ...at, ...calcularDatas(at.dataD0) }
  await db.insert(atendimento).values(valores).onConflictDoUpdate({ target: atendimento.id, set: { ...valores, atualizadoEm: agora } })

  // O tipo pode ter mudado: recalcula quem está no protocolo
  const linhas = await db.select().from(atendimentoAnimal).where(eq(atendimentoAnimal.atendimentoId, at.id))
  for (const linha of linhas) {
    const normalizada = normalizarLinhaAnimal(at.tipo, linha)
    await db.update(atendimentoAnimal).set(normalizada).where(eq(atendimentoAnimal.id, linha.id))
  }
}

async function salvarAtendimentoAnimal(db: Db, vetId: string, dados: unknown) {
  const aa = esquemas.atendimentoAnimal.parse(dados)
  const [existente] = await db.select({ atendimentoId: atendimentoAnimal.atendimentoId }).from(atendimentoAnimal).where(eq(atendimentoAnimal.id, aa.id))
  if (existente) await buscarAtendimento(db, vetId, existente.atendimentoId)
  const at = await buscarAtendimento(db, vetId, aa.atendimentoId)
  const [vaca] = await db.select({ loteId: animal.loteId }).from(animal).where(eq(animal.id, aa.animalId))
  if (!vaca || vaca.loteId !== at.loteId) throw new ErroOperacao('Vaca não pertence ao lote do atendimento.')

  const linha = normalizarLinhaAnimal(at.tipo, aa)
  const erro = validarLinhaAnimal(linha)
  if (erro) throw new ErroOperacao(erro)
  await db.insert(atendimentoAnimal).values(linha)
    .onConflictDoUpdate({ target: atendimentoAnimal.id, set: { ...linha, atualizadoEm: agora } })
}

const salvar = {
  propriedade: salvarPropriedade,
  lote: salvarLote,
  animal: salvarAnimal,
  atendimento: salvarAtendimento,
  atendimentoAnimal: salvarAtendimentoAnimal,
}

/**
 * Aplica as operações na ordem em que foram feitas no aparelho. Cada operação é um upsert
 * pelo id gerado no aparelho, então reenviar a mesma operação não duplica nada.
 */
export async function aplicarOperacoes(vetId: string, operacoes: Operacao[]): Promise<ResultadoOperacao[]> {
  const db = await useDb()
  const resultados: ResultadoOperacao[] = []
  for (const op of operacoes) {
    try {
      await db.transaction(tx => salvar[op.entidade](tx as unknown as Db, vetId, op.dados))
      resultados.push({ id: op.id, ok: true })
    }
    catch (e) {
      if (e instanceof ErroOperacao) resultados.push({ id: op.id, ok: false, erro: e.message })
      else if (e instanceof Error && e.name === 'ZodError') resultados.push({ id: op.id, ok: false, erro: 'Dados inválidos.' })
      else throw e
    }
  }
  return resultados
}

/** Tudo o que o veterinário tem, com os valores calculados no servidor. */
export async function montarSnapshot(vetId: string): Promise<Snapshot> {
  const db = await useDb()
  const propriedades = await db.select().from(propriedade).where(eq(propriedade.veterinarioId, vetId))
  const lotes = propriedades.length
    ? await db.select().from(lote).where(inArray(lote.propriedadeId, propriedades.map(p => p.id)))
    : []
  const loteIds = lotes.map(l => l.id)
  const animais = loteIds.length ? await db.select().from(animal).where(inArray(animal.loteId, loteIds)) : []
  const atendimentos = loteIds.length ? await db.select().from(atendimento).where(inArray(atendimento.loteId, loteIds)) : []
  const atendimentoAnimais = atendimentos.length
    ? await db.select().from(atendimentoAnimal).where(inArray(atendimentoAnimal.atendimentoId, atendimentos.map(a => a.id)))
    : []

  const vacasPorLote = contarPor(animais, a => a.loteId)
  const atendimentosComResultado = atendimentos.map(at => ({
    ...at,
    previsaoParto: previsaoPartoIatf(at.dataD10),
    resultado: calcularResultado(atendimentoAnimais.filter(l => l.atendimentoId === at.id), vacasPorLote.get(at.loteId) ?? 0),
  }))

  const propriedadeDoLote = new Map(lotes.map(l => [l.id, l.propriedadeId]))
  const propriedadesComResumo = propriedades.map(({ veterinarioId: _, atualizadoEm: __, ...p }) => {
    const doLote = (loteId: string) => propriedadeDoLote.get(loteId) === p.id
    const iatf = atendimentosComResultado.filter(a => doLote(a.loteId) && a.tipo === 'dg_iatf' && a.status !== 'dg')
    const inseminadas = iatf.reduce((s, a) => s + a.resultado.inseminadas, 0)
    const prenhas = iatf.reduce((s, a) => s + a.resultado.prenhasD45, 0)
    return {
      ...p,
      resumo: {
        animais: animais.filter(a => doLote(a.loteId)).length,
        iatf: iatf.length,
        taxaPrenhez: inseminadas ? Math.round((prenhas / inseminadas) * 1000) / 10 : null,
      },
    }
  })

  return {
    propriedades: propriedadesComResumo,
    lotes: lotes.map(semCarimbo),
    animais: animais.map(semCarimbo),
    atendimentos: atendimentosComResultado.map(semCarimbo),
    atendimentoAnimais: atendimentoAnimais.map(semCarimbo),
  }
}

function semCarimbo<T extends { atualizadoEm: Date }>({ atualizadoEm: _, ...resto }: T) {
  return resto
}

function contarPor<T>(itens: T[], chave: (item: T) => string) {
  const mapa = new Map<string, number>()
  for (const item of itens) mapa.set(chave(item), (mapa.get(chave(item)) ?? 0) + 1)
  return mapa
}
