import type { Animal, Atendimento, AtendimentoAnimal, Lote } from '#shared/types/entidades'

export interface PassagemPorAtendimento {
  atendimento: Atendimento
  linha: AtendimentoAnimal
}

export function useAnimal(id: () => string) {
  const { dados, carregando } = useConsulta(id, async (aid) => {
    const [animal, linhas] = await Promise.all([
      bancoLocal.animais.get(aid),
      bancoLocal.atendimentoAnimais.where('animalId').equals(aid).toArray(),
    ])
    const lote = animal ? await bancoLocal.lotes.get(animal.loteId) : undefined
    const atendimentos = await bancoLocal.atendimentos.bulkGet(linhas.map(l => l.atendimentoId))
    const passagens = linhas
      .map((linha, i) => ({ linha, atendimento: atendimentos[i] }))
      .filter((p): p is PassagemPorAtendimento => !!p.atendimento && p.linha.situacaoDg !== 'pendente')
      .sort((a, b) => b.atendimento.dataD0.localeCompare(a.atendimento.dataD0))
    return { animal, lote, passagens }
  }, { animal: undefined as Animal | undefined, lote: undefined as Lote | undefined, passagens: [] as PassagemPorAtendimento[] })
  return {
    animal: computed(() => dados.value.animal),
    lote: computed(() => dados.value.lote),
    passagens: computed(() => dados.value.passagens),
    carregando,
  }
}

export function salvarAnimal(dados: Omit<Animal, 'id'> & { id?: string }) {
  return useSincronizacao().registrar('animal', { ...dados, id: dados.id ?? novoId() })
}

/** Altera só alguns campos da vaca (ex.: previsão de parto na tela do DG). */
export function atualizarAnimal(id: string, campos: Partial<Animal>) {
  return useSincronizacao().registrar('animal', { ...campos, id })
}

/** Número já usado por outra vaca do mesmo lote. */
export async function numeroRepetido(loteId: string, numero: string, ignorarId?: string) {
  const animais = await bancoLocal.animais.where('loteId').equals(loteId).toArray()
  return animais.some(a => a.id !== ignorarId && a.numero.trim() === numero.trim())
}
