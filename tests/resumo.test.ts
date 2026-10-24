import { describe, expect, it } from 'vitest'
import type { Snapshot } from '#shared/types/entidades'
import { resumirVeterinario } from '../server/utils/resumo'

const atendimento = (id: string, status: string, inseminadas: number, prenhasD45: number, tipo = 'dg_iatf') =>
  ({ id, loteId: 'l1', tipo, status, dataD0: '2026-10-24', resultado: { inseminadas, prenhasD45 } })
const vaca = (atendimentoId: string, semen: string | null, resultadoD45: string | null) =>
  ({ atendimentoId, situacaoDg: 'vazia', emProtocolo: true, inseminada: true, semen, resultadoD45 })

const snapshot = {
  propriedades: [{ id: 'p1' }],
  lotes: [{ id: 'l1', propriedadeId: 'p1' }],
  animais: [],
  atendimentos: [
    atendimento('a1', 'finalizado', 4, 3),
    atendimento('a2', 'protocolo', 1, 0),
    atendimento('a3', 'dg', 1, 1), // ainda no DG: não é IATF
  ],
  atendimentoAnimais: [
    vaca('a1', 'Nelore XP', 'prenha'),
    vaca('a1', 'nelore xp ', 'prenha'),
    vaca('a1', 'Angus 12', 'vazia'),
    vaca('a1', null, 'prenha'),
    vaca('a2', 'Angus 12', null),
    vaca('a3', 'Nelore XP', 'prenha'),
  ],
} as unknown as Snapshot

describe('resumo do veterinário', () => {
  it('compara a prenhez pelo sêmen de cada vaca, só em IATF finalizado', () => {
    expect(resumirVeterinario(snapshot).semen).toEqual([
      { rotulo: 'Nelore XP', tipo: 'semen', inseminadas: 2, prenhas: 2, taxaPrenhez: 100 },
      { rotulo: 'Angus 12', tipo: 'semen', inseminadas: 1, prenhas: 0, taxaPrenhez: 0 },
      { rotulo: 'Não informado', tipo: 'nao_informado', inseminadas: 1, prenhas: 1, taxaPrenhez: 100 },
    ])
  })

  it('conta só IATF que passou do DG', () => {
    const r = resumirVeterinario(snapshot)
    expect(r.iatfPorAno).toEqual([{ ano: 2026, total: 2 }])
    expect(r.taxaPrenhez).toBe(75)
  })
})
