import { randomUUID } from 'node:crypto'
import { beforeAll, describe, expect, it } from 'vitest'
import { tabelas, useDb } from '../server/utils/db'
import { aplicarOperacoes, montarSnapshot } from '../server/utils/sincronizacao'

let vet: string
let outroVet: string
const ids = { propriedade: randomUUID(), lote: randomUUID(), vacaA: randomUUID(), vacaB: randomUUID(), atendimento: randomUUID(), linhaA: randomUUID(), linhaB: randomUUID() }
let seq = 0
const op = (entidade: string, dados: Record<string, unknown>) => ({ id: String(++seq), entidade, dados }) as Parameters<typeof aplicarOperacoes>[1][number]

const linha = (id: string, animalId: string, extra: Record<string, unknown> = {}) => op('atendimentoAnimal', {
  id, atendimentoId: ids.atendimento, animalId, situacaoDg: 'vazia', ...extra,
})

beforeAll(async () => {
  const db = await useDb()
  const [a, b] = await db.insert(tabelas.veterinario).values([
    { nome: 'Ana', email: 'ana@teste.com', senhaHash: 'x' },
    { nome: 'Bia', email: 'bia@teste.com', senhaHash: 'x' },
  ]).returning()
  vet = a!.id
  outroVet = b!.id
})

describe('sincronização', () => {
  it('aplica as operações na ordem e calcula no servidor', async () => {
    const r = await aplicarOperacoes(vet, [
      op('propriedade', { id: ids.propriedade, nome: 'Santa Luzia', proprietario: 'José' }),
      op('lote', { id: ids.lote, propriedadeId: ids.propriedade, nome: 'Lote 2' }),
      op('animal', { id: ids.vacaA, loteId: ids.lote, numero: '0412' }),
      op('animal', { id: ids.vacaB, loteId: ids.lote, numero: '0423' }),
      op('atendimento', { id: ids.atendimento, loteId: ids.lote, tipo: 'dg_iatf', status: 'dg', dataD0: '2026-10-24' }),
      linha(ids.linhaA, ids.vacaA),
      linha(ids.linhaB, ids.vacaB, { situacaoDg: 'prenha', inseminada: true }),
    ])
    expect(r.every(x => x.ok)).toBe(true)

    const s = await montarSnapshot(vet)
    const at = s.atendimentos[0]!
    expect(at).toMatchObject({ dataD8: '2026-11-01', dataD10: '2026-11-03', dataD45: '2026-12-18' })
    const porId = new Map(s.atendimentoAnimais.map(l => [l.id, l]))
    expect(porId.get(ids.linhaA)?.emProtocolo).toBe(true)
    // Prenha não entra no protocolo e não guarda dado do IATF
    expect(porId.get(ids.linhaB)).toMatchObject({ emProtocolo: false, inseminada: null })
  })

  it('reenviar a mesma operação não duplica', async () => {
    const repetida = op('animal', { id: ids.vacaA, loteId: ids.lote, numero: '0412' })
    await aplicarOperacoes(vet, [repetida, repetida])
    const s = await montarSnapshot(vet)
    expect(s.animais).toHaveLength(2)
  })

  it('recusa não inseminada sem justificativa e segue com as próximas', async () => {
    const r = await aplicarOperacoes(vet, [
      linha(ids.linhaA, ids.vacaA, { inseminada: false }),
      linha(ids.linhaA, ids.vacaA, { inseminada: true, resultadoD45: 'prenha' }),
    ])
    expect(r[0]).toMatchObject({ ok: false, erro: expect.stringMatching(/justificativa/) })
    expect(r[1]!.ok).toBe(true)
    const at = (await montarSnapshot(vet)).atendimentos[0]!
    expect(at.resultado).toMatchObject({ inseminadas: 1, prenhasD45: 1, taxaInseminacao: 50, taxaPrenhez: 100 })
  })

  it('a mesma vaca duas vezes no atendimento é recusada sem travar a fila', async () => {
    const r = await aplicarOperacoes(vet, [
      linha(randomUUID(), ids.vacaA),
      op('animal', { id: ids.vacaB, loteId: ids.lote, numero: '0423' }),
    ])
    expect(r[0]).toMatchObject({ ok: false, erro: expect.stringMatching(/conflito/) })
    expect(r[1]!.ok).toBe(true)
  })

  it('mudar para "Só DG" tira as vacas do protocolo', async () => {
    await aplicarOperacoes(vet, [op('atendimento', { id: ids.atendimento, loteId: ids.lote, tipo: 'so_dg', status: 'dg', dataD0: '2026-10-24' })])
    const s = await montarSnapshot(vet)
    expect(s.atendimentoAnimais.every(l => !l.emProtocolo && l.inseminada === null)).toBe(true)
  })

  it('guarda o histórico da vaca e recusa contagem negativa', async () => {
    const vaca = { id: ids.vacaA, loteId: ids.lote, numero: '0412' }
    const r = await aplicarOperacoes(vet, [
      op('animal', { ...vaca, numPrenhezes: 3, numPartos: 2, numAbortos: 1, numPerdasGestacionais: 0, diasVazia: 120, motivoDescarte: 'cisto' }),
      op('animal', { ...vaca, numPartos: -1 }),
    ])
    expect(r.map(x => x.ok)).toEqual([true, false])
    const a = (await montarSnapshot(vet)).animais.find(x => x.id === ids.vacaA)
    expect(a).toMatchObject({ numPrenhezes: 3, numPartos: 2, numAbortos: 1, numPerdasGestacionais: 0, diasVazia: 120, motivoDescarte: 'cisto' })
  })

  it('cada veterinário só vê e altera o que é seu', async () => {
    const r = await aplicarOperacoes(outroVet, [
      op('propriedade', { id: ids.propriedade, nome: 'Invadida' }),
      op('animal', { id: randomUUID(), loteId: ids.lote, numero: '999' }),
    ])
    expect(r.every(x => !x.ok)).toBe(true)
    expect((await montarSnapshot(outroVet)).propriedades).toHaveLength(0)
    expect((await montarSnapshot(vet)).propriedades[0]!.nome).toBe('Santa Luzia')
  })
})
