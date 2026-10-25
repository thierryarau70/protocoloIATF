import { createHash, randomBytes } from 'node:crypto'
import { and, eq, gt, isNull, lt, or } from 'drizzle-orm'
import { createError } from 'h3'
import { tabelas, useDb } from './db'

const VALIDADE_MIN = 60

const hashDoToken = (token: string) => createHash('sha256').update(token).digest('hex')

/**
 * Cria um link de redefinição para o e-mail, se houver conta. Devolve o token (vai só no e-mail;
 * no banco fica o hash) ou null quando o e-mail não tem conta.
 */
export async function criarRedefinicao(email: string, agora = new Date()) {
  const db = await useDb()
  const [vet] = await db.select({ id: tabelas.veterinario.id, nome: tabelas.veterinario.nome })
    .from(tabelas.veterinario).where(eq(tabelas.veterinario.email, email))
  // Faxina: links vencidos ou usados não servem para nada
  await db.delete(tabelas.redefinicaoSenha).where(or(
    lt(tabelas.redefinicaoSenha.expiraEm, agora),
    lt(tabelas.redefinicaoSenha.usadoEm, new Date(agora.getTime() - 24 * 60 * 60_000)),
  ))
  if (!vet) return null

  const token = randomBytes(32).toString('base64url')
  await db.insert(tabelas.redefinicaoSenha).values({
    veterinarioId: vet.id,
    tokenHash: hashDoToken(token),
    expiraEm: new Date(agora.getTime() + VALIDADE_MIN * 60_000),
  })
  return { token, nome: vet.nome, validadeMin: VALIDADE_MIN }
}

/** Troca a senha pelo link. O link vale uma vez; os outros links pendentes da conta são apagados. */
export async function redefinirSenha(token: string, senhaHash: string, agora = new Date()) {
  const db = await useDb()
  return db.transaction(async (tx) => {
    const [pedido] = await tx.select().from(tabelas.redefinicaoSenha).where(and(
      eq(tabelas.redefinicaoSenha.tokenHash, hashDoToken(token)),
      isNull(tabelas.redefinicaoSenha.usadoEm),
      gt(tabelas.redefinicaoSenha.expiraEm, agora),
    ))
    if (!pedido) throw createError({ statusCode: 400, message: 'Este link é inválido ou já expirou. Peça um novo em "Esqueci a senha".' })

    const [vet] = await tx.update(tabelas.veterinario).set({ senhaHash })
      .where(eq(tabelas.veterinario.id, pedido.veterinarioId))
      .returning({ id: tabelas.veterinario.id, nome: tabelas.veterinario.nome, email: tabelas.veterinario.email })
    await tx.update(tabelas.redefinicaoSenha).set({ usadoEm: agora }).where(eq(tabelas.redefinicaoSenha.id, pedido.id))
    await tx.delete(tabelas.redefinicaoSenha).where(and(
      eq(tabelas.redefinicaoSenha.veterinarioId, pedido.veterinarioId),
      isNull(tabelas.redefinicaoSenha.usadoEm),
    ))
    return vet!
  })
}
