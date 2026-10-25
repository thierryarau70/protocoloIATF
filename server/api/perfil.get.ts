import { eq } from 'drizzle-orm'
import type { Perfil } from '#shared/types/entidades'

export default defineEventHandler(async (event): Promise<Perfil> => {
  const vetId = await veterinarioDaSessao(event)
  const db = await useDb()
  const [vet] = await db.select().from(tabelas.veterinario).where(eq(tabelas.veterinario.id, vetId))
  if (!vet) throw createError({ statusCode: 404, message: 'Veterinário não encontrado.' })

  return {
    nome: vet.nome,
    email: vet.email,
    crmv: vet.crmv,
    empresa: vet.empresa,
    local: vet.local,
    logoUrl: vet.logoUrl,
    contato: vet.contato,
    resumo: resumirVeterinario(await montarSnapshot(vetId)),
  }
})
