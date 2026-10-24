import type { z } from 'zod'
import type { esquemaAnimal, esquemaAtendimento, esquemaAtendimentoAnimal, esquemaLote, esquemaPerfil, esquemaPropriedade } from '../esquemas'

export type SituacaoDg = 'pendente' | 'prenha' | 'vazia' | 'descarte' | 'refugo'

export interface ResumoPropriedade {
  animais: number
  iatf: number
  taxaPrenhez: number | null
}

export interface ResultadoAtendimento {
  dg: Record<SituacaoDg, number>
  emProtocolo: number
  inseminadas: number
  naoInseminadas: number
  prenhasD45: number
  vaziasD45: number
  taxaInseminacao: number | null
  taxaPrenhez: number | null
}

export type Propriedade = z.infer<typeof esquemaPropriedade> & { resumo?: ResumoPropriedade }
export type Lote = z.infer<typeof esquemaLote>
export type Animal = z.infer<typeof esquemaAnimal>
// Campos calculados no servidor chegam pela sincronização; ausentes enquanto o registro só existe no aparelho
export type Atendimento = z.infer<typeof esquemaAtendimento> & {
  dataD8?: string
  dataD10?: string
  dataD45?: string
  previsaoParto?: string
  resultado?: ResultadoAtendimento
}
export type AtendimentoAnimal = z.infer<typeof esquemaAtendimentoAnimal> & { emProtocolo?: boolean }

export interface Snapshot {
  propriedades: Propriedade[]
  lotes: Lote[]
  animais: Animal[]
  atendimentos: Atendimento[]
  atendimentoAnimais: AtendimentoAnimal[]
}

export interface ResultadoOperacao {
  id: string
  ok: boolean
  erro?: string
}

export type DadosPerfil = z.infer<typeof esquemaPerfil>

export interface Perfil extends DadosPerfil {
  email: string
  resumo: {
    propriedades: number
    iatfPorAno: { ano: number, total: number }[]
    taxaPrenhez: number | null
  }
}

export interface Usuario {
  id: string
  nome: string
  email: string
}
