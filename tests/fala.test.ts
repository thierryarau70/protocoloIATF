import { describe, expect, it } from 'vitest'
import { acharNumero, interpretarFala } from '../app/utils/fala'

describe('ditado no curral', () => {
  it.each([
    ['doze prenha sessenta dias', { numero: '12', situacao: 'prenha', idadeGestacional: '60 dias' }],
    ['12 prenha 60 dias', { numero: '12', situacao: 'prenha', idadeGestacional: '60 dias' }],
    ['vaca 412 vazia', { numero: '412', situacao: 'vazia' }],
    ['cento e vinte e três descarte', { numero: '123', situacao: 'descarte' }],
    ['quatro mil e doze refugo', { numero: '4012', situacao: 'refugo' }],
    ['trinta e cinco prenhe dois meses', { numero: '35', situacao: 'prenha', idadeGestacional: '2 meses' }],
    ['vinte prenha noventa', { numero: '20', situacao: 'prenha', idadeGestacional: '90 dias' }],
    ['Vazia', { situacao: 'vazia' }],
    ['prenha 45 dias', { situacao: 'prenha', idadeGestacional: '45 dias' }],
    ['número 7', { numero: '7' }],
  ])('"%s"', (frase, esperado) => {
    expect(interpretarFala(frase)).toEqual(esperado)
  })

  it('frase sem nada útil não inventa', () => {
    expect(interpretarFala('ela está bem')).toEqual({})
  })

  it('número da vaca ignora zeros à esquerda', () => {
    const lote = ['0412', '12', '7']
    expect(acharNumero('412', lote)).toBe('0412')
    expect(acharNumero('12', lote)).toBe('12')
    expect(acharNumero('0007', lote)).toBe('7')
    expect(acharNumero('99', lote)).toBeUndefined()
  })
})
