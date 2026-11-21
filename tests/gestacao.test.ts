import { describe, expect, it } from 'vitest'
import { diasDeGestacao, previsaoPartoPeloDg } from '../app/utils/gestacao'

describe('previsão de parto pela idade gestacional', () => {
  it.each([
    ['60', 60], ['60 dias', 60], ['2 meses', 60], ['2,5 meses', 75], ['8 semanas', 56], ['90d', 90],
    ['', null], ['prenha', null], ['300 dias', null], ['0', null],
  ])('"%s" → %s dias', (texto, dias) => {
    expect(diasDeGestacao(texto)).toBe(dias)
  })

  it('soma à data do DG o que falta dos 283 dias', () => {
    // DG em 21/11/2026 com 60 dias: faltam 223 dias
    expect(previsaoPartoPeloDg('2026-11-21', '60 dias')).toBe('2027-07-02')
    expect(previsaoPartoPeloDg('2026-11-21', 'sem idade')).toBeNull()
  })
})
