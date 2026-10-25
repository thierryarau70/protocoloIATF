import type { Animal, Atendimento, Lote, Propriedade } from '#shared/types/entidades'

export function useLotes() {
  const { dados: lotes, carregando } = useConsulta(() => 0, async () => {
    const [lotes, propriedades, animais] = await Promise.all([bancoLocal.lotes.toArray(), bancoLocal.propriedades.toArray(), bancoLocal.animais.toArray()])
    const nomes = new Map(propriedades.map(p => [p.id, p.nome]))
    return lotes
      .map(l => ({ ...l, propriedade: nomes.get(l.propriedadeId) ?? '', totalAnimais: animais.filter(a => a.loteId === l.id).length }))
      .sort((a, b) => a.propriedade.localeCompare(b.propriedade, 'pt-BR') || porNome(a, b))
  }, [])
  return { lotes, carregando }
}

export function useLote(id: () => string) {
  const { dados, carregando } = useConsulta(id, async (lid) => {
    const lote = await bancoLocal.lotes.get(lid)
    const [propriedade, animais, atendimentos] = await Promise.all([
      lote ? bancoLocal.propriedades.get(lote.propriedadeId) : undefined,
      bancoLocal.animais.where('loteId').equals(lid).toArray(),
      bancoLocal.atendimentos.where('loteId').equals(lid).toArray(),
    ])
    return {
      lote,
      propriedade,
      animais: animais.sort(porNumero),
      atendimentos: atendimentos.sort((a, b) => b.dataD0.localeCompare(a.dataD0)),
    }
  }, { lote: undefined as Lote | undefined, propriedade: undefined as Propriedade | undefined, animais: [] as Animal[], atendimentos: [] as Atendimento[] })

  return {
    lote: computed(() => dados.value.lote),
    propriedade: computed(() => dados.value.propriedade),
    animais: computed(() => dados.value.animais),
    atendimentos: computed(() => dados.value.atendimentos),
    carregando,
  }
}

export function salvarLote(dados: Omit<Lote, 'id'> & { id?: string }) {
  return useSincronizacao().registrar('lote', { ...dados, id: dados.id ?? novoId() })
}
