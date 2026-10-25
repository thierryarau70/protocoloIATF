import type { Atendimento, AtendimentoAnimal } from '#shared/types/entidades'

export type Etapa = 'd8' | 'd10' | 'd45'
export type Quando = 'atrasado' | 'hoje' | 'amanha' | 'semana'

export interface ItemAgenda {
  atendimentoId: string
  etapa: Etapa
  data: string
  quando: Quando
  /** Dias até a data (negativo = atrasado) */
  dias: number
  propriedade: string
  lote: string
}

export interface AtendimentoAgenda extends Atendimento {
  propriedade: string
  lote: string
}

const DIAS_ADIANTE = 7

/**
 * Manejos do protocolo que vencem: atrasados, hoje, amanhã e nos próximos 7 dias.
 * Some quando é feito: D8 com hormônio anotado, D10 com inseminação anotada, D45 com o atendimento finalizado.
 */
export function montarAgenda(atendimentos: AtendimentoAgenda[], linhas: AtendimentoAnimal[], hoje: string): ItemAgenda[] {
  const feito = { d8: new Set<string>(), d10: new Set<string>() }
  for (const l of linhas) {
    if (l.hormonioDia) feito.d8.add(l.atendimentoId)
    if (l.inseminada !== null && l.inseminada !== undefined) feito.d10.add(l.atendimentoId)
  }

  const itens: ItemAgenda[] = []
  for (const a of atendimentos) {
    if (a.tipo !== 'dg_iatf' || a.status === 'finalizado') continue
    // Sem sincronizar, as datas ainda não vieram do servidor: mesma conta (D0+8, D0+10, D10+45)
    const d10 = a.dataD10 ?? somarDias(a.dataD0, 10)
    const datas: Record<Etapa, string> = { d8: a.dataD8 ?? somarDias(a.dataD0, 8), d10, d45: a.dataD45 ?? somarDias(d10, 45) }
    for (const etapa of ['d8', 'd10', 'd45'] as const) {
      if (etapa !== 'd45' && feito[etapa].has(a.id)) continue
      const dias = diferencaDias(hoje, datas[etapa])
      if (dias > DIAS_ADIANTE) continue
      // D8 e D10 atrasados há mais de uma semana já não são agenda: o lote seguiu sem anotar
      if (etapa !== 'd45' && dias < -DIAS_ADIANTE) continue
      itens.push({
        atendimentoId: a.id, etapa, data: datas[etapa], dias,
        quando: dias < 0 ? 'atrasado' : dias === 0 ? 'hoje' : dias === 1 ? 'amanha' : 'semana',
        propriedade: a.propriedade, lote: a.lote,
      })
    }
  }
  return itens.sort((x, y) => x.data.localeCompare(y.data) || x.propriedade.localeCompare(y.propriedade, 'pt-BR'))
}

export const nomeEtapa: Record<Etapa, string> = {
  d8: 'D8 · retirada do implante',
  d10: 'D10 · inseminação',
  d45: 'D45 · DG final',
}

export function linkEtapa(item: Pick<ItemAgenda, 'atendimentoId' | 'etapa'>): string {
  return item.etapa === 'd45' ? `/atendimentos/${item.atendimentoId}/d45` : `/atendimentos/${item.atendimentoId}/planilha`
}

function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

function diferencaDias(de: string, ate: string): number {
  return Math.round((Date.parse(`${ate}T00:00:00Z`) - Date.parse(`${de}T00:00:00Z`)) / 86_400_000)
}
