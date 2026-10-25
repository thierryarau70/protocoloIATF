import { eq } from 'drizzle-orm'
import { esquemaLogin } from '#shared/esquemas'

export default defineEventHandler(async (event) => {
  const { email, senha } = await readValidatedBody(event, esquemaLogin.parse)
  // Por e-mail protege a conta; por IP segura quem testa vários e-mails
  const porEmail = limites.loginEmail(email)
  const porIp = limites.loginIp(getRequestIP(event, { xForwardedFor: true }) ?? 'desconhecido')
  await exigirDentroDoLimite(porEmail, porIp)

  const db = await useDb()
  const [vet] = await db.select().from(tabelas.veterinario).where(eq(tabelas.veterinario.email, email))
  if (!vet || !(await verifyPassword(vet.senhaHash, senha))) {
    await registrarTentativa([porEmail.chave, porIp.chave])
    throw createError({ statusCode: 401, message: 'E-mail ou senha incorretos.' })
  }
  await limparTentativas(porEmail.chave)
  const user = { id: vet.id, nome: vet.nome, email: vet.email }
  await setUserSession(event, { user })
  return user
})
