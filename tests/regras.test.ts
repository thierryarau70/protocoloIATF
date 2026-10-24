import { describe, expect, it } from 'vitest'
import { calcularDatas, calcularResultado, entraNoProtocolo, MAX_SEMENS_GRAFICO, normalizarLinhaAnimal, prenhezPorSemen, validarLinhaAnimal } from '../server/utils/regras'

const linha = (p: Partial<Parameters<typeof validarLinhaAnimal>[0]> = {}) => ({
  situacaoDg: 'vazia' as const, emProtocolo: true, inseminada: null, justificativaNaoInseminada: null, hormonioDia: null, resultadoD45: null, ...p,
})

describe('regras IATF', () => {
  it('calcula D8, D10 e D45 a partir do D0', () => {
    expect(calcularDatas('2026-10-24')).toEqual({ dataD8: '2026-11-01', dataD10: '2026-11-03', dataD45: '2026-12-18' })
  })

  it('só vaca vazia em DG + IATF entra no protocolo', () => {
    expect(entraNoProtocolo('dg_iatf', 'vazia')).toBe(true)
    expect(entraNoProtocolo('so_dg', 'vazia')).toBe(false)
    for (const s of ['prenha', 'descarte', 'refugo', 'pendente'] as const) expect(entraNoProtocolo('dg_iatf', s)).toBe(false)
  })

  it('não inseminada exige justificativa', () => {
    expect(validarLinhaAnimal(linha({ inseminada: false }))).toMatch(/justificativa/)
    expect(validarLinhaAnimal(linha({ inseminada: false, justificativaNaoInseminada: 'cio ausente' }))).toBeNull()
  })

  it('fora do protocolo limpa os dados do IATF', () => {
    const l = normalizarLinhaAnimal('dg_iatf', linha({ situacaoDg: 'prenha', inseminada: true, hormonioDia: 'd8', resultadoD45: 'prenha' }))
    expect(l).toMatchObject({ emProtocolo: false, inseminada: null, hormonioDia: null, resultadoD45: null })
  })

  it('D45 só vale para vaca inseminada', () => {
    expect(normalizarLinhaAnimal('dg_iatf', linha({ inseminada: false, resultadoD45: 'prenha' })).resultadoD45).toBeNull()
  })

  it('calcula as taxas', () => {
    const r = calcularResultado([
      linha({ inseminada: true, resultadoD45: 'prenha' }),
      linha({ inseminada: true, resultadoD45: 'prenha' }),
      linha({ inseminada: true, resultadoD45: 'prenha' }),
      linha({ inseminada: true, resultadoD45: 'vazia' }),
      linha({ situacaoDg: 'prenha', emProtocolo: false }),
    ], 8)
    expect(r.taxaInseminacao).toBe(50)
    expect(r.taxaPrenhez).toBe(75)
    expect(r.dg.prenha).toBe(1)
  })

  it('sêmen só fica registrado em vaca inseminada', () => {
    expect(normalizarLinhaAnimal('dg_iatf', linha({ inseminada: false, justificativaNaoInseminada: 'x', semenId: 's1' })).semenId).toBeNull()
    expect(normalizarLinhaAnimal('dg_iatf', linha({ inseminada: true, semenId: 's1' })).semenId).toBe('s1')
  })

  it('junta os sêmens além do limite em "Outros"', () => {
    const linhas = Array.from({ length: MAX_SEMENS_GRAFICO + 2 }, (_, i) => linha({ inseminada: true, semen: `S${i}`, resultadoD45: 'prenha' }))
    const r = prenhezPorSemen(linhas)
    expect(r).toHaveLength(MAX_SEMENS_GRAFICO + 1)
    expect(r.at(-1)).toMatchObject({ rotulo: 'Outros', tipo: 'outros', inseminadas: 2, prenhas: 2 })
  })
})
