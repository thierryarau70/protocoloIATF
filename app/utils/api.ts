/** Única porta de saída HTTP do app: usada só pelos composables. */
export const api = $fetch.create({ credentials: 'same-origin' })

export function mensagemDeErro(e: unknown, padrao = 'Não foi possível concluir.'): string {
  const dados = (e as { data?: { message?: string } })?.data
  return dados?.message ?? padrao
}

export function eErroDeRede(e: unknown): boolean {
  return !(e as { response?: unknown })?.response
}
