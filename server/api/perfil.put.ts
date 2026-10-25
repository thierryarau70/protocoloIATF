import { eq } from 'drizzle-orm'
import { esquemaPerfil } from '#shared/esquemas'

export default defineEventHandler(async (event) => {
  const vetId = await veterinarioDaSessao(event)
  const dados = await readValidatedBody(event, esquemaPerfil.parse)
  const db = await useDb()
  await db.update(tabelas.veterinario).set(dados).where(eq(tabelas.veterinario.id, vetId))
  const { user } = await requireUserSession(event)
  await setUserSession(event, { user: { ...user, nome: dados.nome } })
  return { ok: true }
})
