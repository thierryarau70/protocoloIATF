import type { H3Event } from 'h3'

export async function veterinarioDaSessao(event: H3Event): Promise<string> {
  const { user } = await requireUserSession(event)
  return user.id
}
