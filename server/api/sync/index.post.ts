import { z } from 'zod'
import { esquemaOperacao } from '#shared/esquemas'

const corpo = z.object({ operacoes: z.array(esquemaOperacao).max(500) })

export default defineEventHandler(async (event) => {
  const vetId = await veterinarioDaSessao(event)
  const { operacoes } = await readValidatedBody(event, corpo.parse)
  return { resultados: await aplicarOperacoes(vetId, operacoes) }
})
