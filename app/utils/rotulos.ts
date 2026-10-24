import type { SituacaoDg } from '#shared/types/entidades'

export type Tom = 'verde' | 'ambar' | 'vermelho' | 'neutro'

export const situacoesDg: { valor: Exclude<SituacaoDg, 'pendente'>, rotulo: string, tom: Tom }[] = [
  { valor: 'prenha', rotulo: 'Prenha', tom: 'verde' },
  { valor: 'vazia', rotulo: 'Vazia', tom: 'ambar' },
  { valor: 'descarte', rotulo: 'Descarte', tom: 'vermelho' },
  { valor: 'refugo', rotulo: 'Refugo', tom: 'neutro' },
]

export const rotuloSituacao: Record<SituacaoDg, string> = {
  pendente: 'Pendente', prenha: 'Prenha', vazia: 'Vazia', descarte: 'Descarte', refugo: 'Refugo',
}

export const tomSituacao: Record<SituacaoDg, Tom> = {
  pendente: 'neutro', prenha: 'verde', vazia: 'ambar', descarte: 'vermelho', refugo: 'neutro',
}

export const rotuloStatus = { dg: 'Em DG', protocolo: 'Em protocolo', finalizado: 'Finalizado' } as const
