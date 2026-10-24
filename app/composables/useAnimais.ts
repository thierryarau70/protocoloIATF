import type { Animal, Lote } from '#shared/types/entidades'

export function useAnimal(id: () => string) {
  const { dados, carregando } = useConsulta(id, async (aid) => {
    const animal = await bancoLocal.animais.get(aid)
    const lote = animal ? await bancoLocal.lotes.get(animal.loteId) : undefined
    return { animal, lote }
  }, { animal: undefined as Animal | undefined, lote: undefined as Lote | undefined })
  return { animal: computed(() => dados.value.animal), lote: computed(() => dados.value.lote), carregando }
}

export function salvarAnimal(dados: Omit<Animal, 'id'> & { id?: string }) {
  return useSincronizacao().registrar('animal', { ...dados, id: dados.id ?? novoId() })
}

/** Número já usado por outra vaca do mesmo lote. */
export async function numeroRepetido(loteId: string, numero: string, ignorarId?: string) {
  const animais = await bancoLocal.animais.where('loteId').equals(loteId).toArray()
  return animais.some(a => a.id !== ignorarId && a.numero.trim() === numero.trim())
}
