import { describe, expect, it } from 'vitest'
import type { AtendimentoAnimal } from '#shared/types/entidades'
import { type AtendimentoAgenda, montarAgenda } from '../app/utils/agenda'

const at = (id: string, dataD0: string, extra: Partial<AtendimentoAgenda> = {}): AtendimentoAgenda => ({
  id, loteId: 'l', tipo: 'dg_iatf', status: 'protocolo', dataD0, gnrh: null, horaD8: null, horaD10: null,
  inseminador: null, animaisPerdidos: 0, propriedade: 'Boa Vista', lote: 'Lote 1', ...extra,
})
const linha = (atendimentoId: string, campos: Partial<AtendimentoAnimal>) =>
  ({ id: `${atendimentoId}-x`, atendimentoId, animalId: 'v', situacaoDg: 'vazia', ...campos }) as AtendimentoAnimal

const HOJE = '2026-10-25'

describe('agenda do protocolo', () => {
  it('D8 hoje, D10 em 2 dias; D45 fora da semana não aparece', () => {
    const itens = montarAgenda([at('a', '2026-10-17')], [], HOJE)
    expect(itens.map(i => [i.etapa, i.data, i.quando])).toEqual([
      ['d8', '2026-10-25', 'hoje'],
      ['d10', '2026-10-27', 'semana'],
    ])
  })

  it('usa as datas do servidor quando já vieram', () => {
    const itens = montarAgenda([at('a', '2026-10-17', { dataD8: '2026-10-26', dataD10: '2026-10-28', dataD45: '2026-12-12' })], [], HOJE)
    expect(itens.map(i => [i.etapa, i.quando])).toEqual([['d8', 'amanha'], ['d10', 'semana']])
  })

  it('some o que já foi anotado', () => {
    const linhas = [linha('a', { hormonioDia: 'd8' }), linha('a', { inseminada: false })]
    expect(montarAgenda([at('a', '2026-10-17')], linhas, HOJE)).toEqual([])
  })

  it('D45 atrasado continua até finalizar; D8/D10 velhos saem', () => {
    // a: D0 01/09, D10 11/09, D45 26/10 (amanhã). b: D0 20/08, D10 30/08, D45 14/10 (11 dias atrás)
    const itens = montarAgenda([at('a', '2026-09-01'), at('b', '2026-08-20')], [], HOJE)
    expect(itens.map(i => [i.atendimentoId, i.etapa, i.quando, i.dias])).toEqual([
      ['b', 'd45', 'atrasado', -11],
      ['a', 'd45', 'amanha', 1],
    ])
  })

  it('ignora Só DG e finalizados', () => {
    const itens = montarAgenda([at('a', '2026-10-17', { tipo: 'so_dg' }), at('b', '2026-10-17', { status: 'finalizado' })], [], HOJE)
    expect(itens).toEqual([])
  })
})
