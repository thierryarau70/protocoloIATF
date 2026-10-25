import { eq } from 'drizzle-orm'
import { beforeAll, describe, expect, it } from 'vitest'
import { tabelas, useDb } from '../server/utils/db'
import { criarRedefinicao, redefinirSenha } from '../server/utils/redefinicao'

const senhaDe = async (email: string) => {
  const db = await useDb()
  const [v] = await db.select({ h: tabelas.veterinario.senhaHash }).from(tabelas.veterinario).where(eq(tabelas.veterinario.email, email))
  return v!.h
}

beforeAll(async () => {
  const db = await useDb()
  await db.insert(tabelas.veterinario).values({ nome: 'Eva Souza', email: 'eva@teste.com', senhaHash: 'antiga' })
})

describe('esqueci a senha', () => {
  it('e-mail sem conta não gera link', async () => {
    expect(await criarRedefinicao('ninguem@teste.com')).toBeNull()
  })

  it('o link troca a senha uma vez só e guarda só o hash', async () => {
    const pedido = await criarRedefinicao('eva@teste.com')
    expect(pedido?.nome).toBe('Eva Souza')
    const db = await useDb()
    const guardados = await db.select().from(tabelas.redefinicaoSenha)
    expect(guardados.some(g => g.tokenHash === pedido!.token)).toBe(false)

    const vet = await redefinirSenha(pedido!.token, 'nova-1')
    expect(vet.email).toBe('eva@teste.com')
    expect(await senhaDe('eva@teste.com')).toBe('nova-1')
    await expect(redefinirSenha(pedido!.token, 'nova-2')).rejects.toMatchObject({ statusCode: 400 })
    expect(await senhaDe('eva@teste.com')).toBe('nova-1')
  })

  it('expira em 1 hora', async () => {
    const t0 = new Date()
    const pedido = await criarRedefinicao('eva@teste.com', t0)
    await expect(redefinirSenha(pedido!.token, 'tarde', new Date(t0.getTime() + 61 * 60_000))).rejects.toMatchObject({ statusCode: 400 })
    expect(await senhaDe('eva@teste.com')).toBe('nova-1')
  })

  it('usar um link apaga os outros pendentes da conta', async () => {
    const a = await criarRedefinicao('eva@teste.com')
    const b = await criarRedefinicao('eva@teste.com')
    await redefinirSenha(b!.token, 'nova-3')
    await expect(redefinirSenha(a!.token, 'nova-4')).rejects.toMatchObject({ statusCode: 400 })
    expect(await senhaDe('eva@teste.com')).toBe('nova-3')
  })

  it('token inventado não serve', async () => {
    await expect(redefinirSenha('x'.repeat(43), 'qualquer')).rejects.toMatchObject({ statusCode: 400 })
  })
})
