import { describe, expect, it } from 'vitest'
import type { Animal, Atendimento, AtendimentoAnimal } from '#shared/types/entidades'
import { relatorioPartos } from '../app/utils/indicadores'

const vaca = (id: string, numero: string, extra: Partial<Animal> = {}) => ({ id, loteId: 'l1', numero, previsaoParto: null, touroPrenhez: null, ...extra }) as Animal
const linha = (animalId: string, extra: Partial<AtendimentoAnimal> = {}) => ({ id: `x-${animalId}`, atendimentoId: 'a1', animalId, situacaoDg: 'vazia', inseminada: null, resultadoD45: null, semenId: null, ...extra }) as AtendimentoAnimal
const atendimento = { id: 'a1', loteId: 'l1', tipo: 'dg_iatf', status: 'protocolo', dataD0: '2026-10-01', dataD10: '2026-10-11', semenId: 's1', variosTouros: false } as Atendimento
const base = {
  propriedades: [{ id: 'p1', nome: 'Santa Luzia' }] as never[],
  lotes: [{ id: 'l1', propriedadeId: 'p1', nome: 'Lote 1' }] as never[],
  semens: [{ id: 's1', propriedadeId: 'p1', nome: 'Brutus' }, { id: 's2', propriedadeId: 'p1', nome: 'Netuno' }] as never[],
  atendimentos: [atendimento],
}

describe('relatório de previsão de parto', () => {
  const dados = {
    ...base,
    animais: [vaca('v1', '10'), vaca('v2', '11'), vaca('v3', '12'), vaca('v4', '13', { previsaoParto: '2027-03-01' }), vaca('v5', '14')],
    linhas: [
      linha('v1', { inseminada: true }), // a confirmar, touro do lote
      linha('v2', { inseminada: true, resultadoD45: 'prenha', semenId: 's2' }), // confirmada, touro da vaca
      linha('v3', { inseminada: true, resultadoD45: 'vazia' }), // vazia no D45: fora
      linha('v4', { situacaoDg: 'prenha' }), // prenha no DG
      linha('v5', { inseminada: false }), // não inseminada: fora
    ],
  }

  it('lista inseminadas (D10 + 283) e prenhas do DG, sem as vazias do D45', () => {
    const r = relatorioPartos(dados, {}, '2026-11-21')
    expect(r.map(l => [l.numero, l.situacao, l.touro, l.previsao])).toEqual([
      ['13', 'dg', '', '2027-03-01'],
      ['10', 'a-confirmar', 'Brutus', '2027-07-21'],
      ['11', 'confirmada', 'Netuno', '2027-07-21'],
    ])
  })

  it('antes do D10 as inseminadas ainda não entram', () => {
    expect(relatorioPartos(dados, {}, '2026-10-05').map(l => l.numero)).toEqual(['13'])
  })

  it('filtra por atendimento e por fazenda', () => {
    expect(relatorioPartos(dados, { atendimentoId: 'outro' }, '2026-11-21')).toEqual([])
    expect(relatorioPartos(dados, { propriedadeId: 'p1' }, '2026-11-21')).toHaveLength(3)
  })
})
