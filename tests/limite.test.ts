import { describe, expect, it } from 'vitest'
import { exigirDentroDoLimite, limites, limparTentativas, minutosBloqueado, registrarTentativa } from '../server/utils/limite'

const min = (n: number) => n * 60_000

describe('limite de tentativas', () => {
  it('libera até o máximo e bloqueia a partir dele', async () => {
    const limite = limites.loginEmail('ana@teste.com')
    const t0 = new Date('2026-10-24T12:00:00Z')
    for (let i = 0; i < 4; i++) await registrarTentativa([limite.chave], new Date(t0.getTime() + min(i)))
    expect(await minutosBloqueado(limite, new Date(t0.getTime() + min(4)))).toBeNull()

    await registrarTentativa([limite.chave], new Date(t0.getTime() + min(4)))
    // A 1ª tentativa (12:00) sai da janela de 15 min às 12:15
    expect(await minutosBloqueado(limite, new Date(t0.getTime() + min(5)))).toBe(10)
    expect(await minutosBloqueado(limite, new Date(t0.getTime() + min(14) + 30_000))).toBe(1)
    expect(await minutosBloqueado(limite, new Date(t0.getTime() + min(15)))).toBeNull()
  })

  it('conta cada chave separado', async () => {
    const bia = limites.loginEmail('bia@teste.com')
    const agora = new Date('2026-10-24T13:00:00Z')
    for (let i = 0; i < 5; i++) await registrarTentativa([bia.chave], agora)
    expect(await minutosBloqueado(bia, agora)).toBe(15)
    expect(await minutosBloqueado(limites.loginEmail('caio@teste.com'), agora)).toBeNull()
  })

  it('login certo limpa as falhas do e-mail', async () => {
    const limite = limites.loginEmail('davi@teste.com')
    const agora = new Date()
    for (let i = 0; i < 5; i++) await registrarTentativa([limite.chave], agora)
    expect(await minutosBloqueado(limite, agora)).not.toBeNull()
    await limparTentativas(limite.chave)
    expect(await minutosBloqueado(limite, agora)).toBeNull()
  })

  it('responde 429 com o tempo de espera', async () => {
    const limite = limites.cadastroIp('10.0.0.1')
    for (let i = 0; i < 5; i++) await registrarTentativa([limite.chave])
    await expect(exigirDentroDoLimite(limite)).rejects.toMatchObject({
      statusCode: 429,
      message: expect.stringMatching(/^Muitas tentativas\. Tente de novo em \d+ minutos?\.$/),
    })
  })
})
