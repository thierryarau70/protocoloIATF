import Dexie, { type Table } from 'dexie'
import type { Entidade } from '#shared/esquemas'
import type { Animal, Atendimento, AtendimentoAnimal, Lote, Propriedade } from '#shared/types/entidades'

export interface ItemFila {
  seq?: number
  entidade: Entidade
  registroId: string
  dados: Record<string, unknown>
}

class BancoLocal extends Dexie {
  propriedades!: Table<Propriedade, string>
  lotes!: Table<Lote, string>
  animais!: Table<Animal, string>
  atendimentos!: Table<Atendimento, string>
  atendimentoAnimais!: Table<AtendimentoAnimal, string>
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
  }
}

export const bancoLocal = new BancoLocal()

export const tabelaDaEntidade = {
  propriedade: bancoLocal.propriedades,
  lote: bancoLocal.lotes,
  animal: bancoLocal.animais,
  atendimento: bancoLocal.atendimentos,
  atendimentoAnimal: bancoLocal.atendimentoAnimais,
} as const satisfies Record<Entidade, Table<{ id: string }, string>>

export const tabelasDeDados = [bancoLocal.propriedades, bancoLocal.lotes, bancoLocal.animais, bancoLocal.atendimentos, bancoLocal.atendimentoAnimais]
