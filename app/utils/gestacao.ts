import { somarDiasData } from '#shared/esquemas'

/** Duração média da gestação bovina (a mesma usada no servidor para a previsão do IATF) */
export const DIAS_GESTACAO = 283

/**
 * Dias de gestação a partir do que foi anotado no DG: "60", "60 dias", "2 meses", "2,5 meses",
 * "8 semanas". Null quando não dá para entender ou passa da gestação inteira.
 */
export function diasDeGestacao(texto: string | null | undefined): number | null {
  const t = (texto ?? '').toLowerCase().replace(',', '.').trim()
  const m = t.match(/(\d+(?:\.\d+)?)\s*(d|dia|dias|s|sem|semana|semanas|m|mes|mês|meses)?\b/)
  if (!m) return null
  const valor = Number(m[1])
  const unidade = m[2] ?? 'dias'
  const dias = Math.round(unidade.startsWith('m') ? valor * 30 : unidade.startsWith('s') ? valor * 7 : valor)
  return dias > 0 && dias < DIAS_GESTACAO ? dias : null
}

/** Previsão de parto: data do DG + o que falta da gestação (283 dias menos a idade gestacional) */
export function previsaoPartoPeloDg(dataDg: string, idadeGestacional: string | null | undefined): string | null {
  const dias = diasDeGestacao(idadeGestacional)
  return dias === null ? null : somarDiasData(dataDg, DIAS_GESTACAO - dias)
}
