import { eq } from 'drizzle-orm'
import { esquemaCadastro } from '#shared/esquemas'

export default defineEventHandler(async (event) => {
  const { nome, email, senha } = await readValidatedBody(event, esquemaCadastro.parse)
  // Toda tentativa conta: limita contas em massa e a sondagem de e-mails cadastrados
  const porIp = limites.cadastroIp(getRequestIP(event, { xForwardedFor: true }) ?? 'desconhecido')
  await exigirDentroDoLimite(porIp)
  await registrarTentativa([porIp.chave])

  const db = await useDb()
  const [existente] = await db.select({ id: tabelas.veterinario.id }).from(tabelas.veterinario).where(eq(tabelas.veterinario.email, email))
  if (existente) throw createError({ statusCode: 409, message: 'Já existe uma conta com este e-mail.' })

  const [vet] = await db.insert(tabelas.veterinario)
    .values({ nome, email, senhaHash: await hashPassword(senha) })
    .returning({ id: tabelas.veterinario.id, nome: tabelas.veterinario.nome, email: tabelas.veterinario.email })
  await setUserSession(event, { user: vet! })
  return vet
})
