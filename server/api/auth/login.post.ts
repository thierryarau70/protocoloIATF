import { eq } from 'drizzle-orm'
import { esquemaLogin } from '#shared/esquemas'

export default defineEventHandler(async (event) => {
  const { email, senha } = await readValidatedBody(event, esquemaLogin.parse)
  const db = await useDb()
  const [vet] = await db.select().from(tabelas.veterinario).where(eq(tabelas.veterinario.email, email))
  if (!vet || !(await verifyPassword(vet.senhaHash, senha))) {
    throw createError({ statusCode: 401, message: 'E-mail ou senha incorretos.' })
  }
  const user = { id: vet.id, nome: vet.nome, email: vet.email }
  await setUserSession(event, { user })
  return user
})
