import { describe, expect, it } from 'vitest'
import type { Snapshot } from '#shared/types/entidades'
import { resumirVeterinario } from '../server/utils/resumo'

const atendimento = (loteId: string, status: string, inseminadas: number, prenhasD45: number, tipo = 'dg_iatf') =>
  ({ loteId, tipo, status, dataD0: '2026-10-24', resultado: { inseminadas, prenhasD45 } })

const snapshot = {
  propriedades: [
    { id: 'p1', semenTipo: 'particular' },
    { id: 'p2', semenTipo: 'misto' },
    { id: 'p3', semenTipo: null },
  ],
  lotes: [{ id: 'l1', propriedadeId: 'p1' }, { id: 'l2', propriedadeId: 'p2' }, { id: 'l3', propriedadeId: 'p3' }],
  animais: [],
  atendimentoAnimais: [],
  atendimentos: [
    atendimento('l1', 'finalizado', 4, 3),
    atendimento('l1', 'protocolo', 2, 0),
    atendimento('l2', 'finalizado', 10, 5),
    atendimento('l2', 'dg', 9, 9), // ainda no DG: não é IATF
    atendimento('l3', 'finalizado', 0, 0, 'so_dg'), // Só DG: não é IATF
  ],
} as unknown as Snapshot

describe('resumo do veterinário', () => {
  it('agrupa a prenhez pelo tipo de sêmen da propriedade, em ordem fixa', () => {
    expect(resumirVeterinario(snapshot).semen).toEqual([
      { tipo: 'particular', iatf: 2, inseminadas: 6, prenhas: 3, taxaPrenhez: 50 },
      { tipo: 'misto', iatf: 1, inseminadas: 10, prenhas: 5, taxaPrenhez: 50 },
    ])
  })

  it('conta só IATF que passou do DG', () => {
    const r = resumirVeterinario(snapshot)
    expect(r.iatfPorAno).toEqual([{ ano: 2026, total: 3 }])
    expect(r.taxaPrenhez).toBe(50)
  })
})
