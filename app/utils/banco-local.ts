import Dexie, { type Table } from 'dexie'
import type { Entidade } from '#shared/esquemas'
import type { Animal, Atendimento, AtendimentoAnimal, Insumo, Lote, Propriedade, Semen } from '#shared/types/entidades'

export interface ItemFila {
  seq?: number
  entidade: Entidade
  registroId: string
  dados: Record<string, unknown>
}

class BancoLocal extends Dexie {
  propriedades!: Table<Propriedade, string>
  lotes!: Table<Lote, string>
  semens!: Table<Semen, string>
  animais!: Table<Animal, string>
  atendimentos!: Table<Atendimento, string>
  atendimentoAnimais!: Table<AtendimentoAnimal, string>
  insumos!: Table<Insumo, string>
  fila!: Table<ItemFila, number>
  meta!: Table<{ chave: string, valor: unknown }, string>

  constructor() {
    super('protocolo-iatf')
    this.version(1).stores({
      propriedades: 'id',
      lotes: 'id, propriedadeId',
      animais: 'id, loteId',
      atendimentos: 'id, loteId',
      atendimentoAnimais: 'id, atendimentoId, [atendimentoId+animalId]',
      fila: '++seq, registroId',
      meta: 'chave',
    })
    // Histórico da vaca: busca as linhas de atendimento pelo animal
    this.version(2).stores({
      atendimentoAnimais: 'id, atendimentoId, animalId, [atendimentoId+animalId]',
    })
    this.version(3).stores({ semens: 'id, propriedadeId' })
    // Estoque de hormônios e implantes
    this.version(4).stores({ insumos: 'id' })
  }
}

export const bancoLocal = new BancoLocal()

export const tabelaDaEntidade = {
  propriedade: bancoLocal.propriedades,
  lote: bancoLocal.lotes,
  semen: bancoLocal.semens,
  animal: bancoLocal.animais,
  atendimento: bancoLocal.atendimentos,
  atendimentoAnimal: bancoLocal.atendimentoAnimais,
  insumo: bancoLocal.insumos,
} as const satisfies Record<Entidade, Table<{ id: string }, string>>

export const tabelasDeDados = [bancoLocal.propriedades, bancoLocal.lotes, bancoLocal.semens, bancoLocal.animais, bancoLocal.atendimentos, bancoLocal.atendimentoAnimais, bancoLocal.insumos]
