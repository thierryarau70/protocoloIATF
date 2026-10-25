import type { Lote, Propriedade } from '#shared/types/entidades'

export function usePropriedades() {
  const { dados: propriedades, carregando } = useConsulta(() => 0, async () => {
    const [lista, lotes, animais] = await Promise.all([bancoLocal.propriedades.toArray(), bancoLocal.lotes.toArray(), bancoLocal.animais.toArray()])
    const loteDe = new Map(lotes.map(l => [l.id, l.propriedadeId]))
    return lista.sort(porNome).map(p => ({
      ...p,
      totalLotes: lotes.filter(l => l.propriedadeId === p.id).length,
      totalAnimais: animais.filter(a => loteDe.get(a.loteId) === p.id).length,
    }))
  }, [])
  return { propriedades, carregando }
}

export function usePropriedade(id: () => string) {
  const { dados, carregando } = useConsulta(id, async (pid) => {
    const [propriedade, lotes] = await Promise.all([
      bancoLocal.propriedades.get(pid),
      bancoLocal.lotes.where('propriedadeId').equals(pid).toArray(),
    ])
    const animais = await bancoLocal.animais.where('loteId').anyOf(lotes.map(l => l.id)).toArray()
    return {
      propriedade,
      lotes: lotes.sort(porNome).map(l => ({ ...l, totalAnimais: animais.filter(a => a.loteId === l.id).length })),
    }
  }, { propriedade: undefined as Propriedade | undefined, lotes: [] as (Lote & { totalAnimais: number })[] })

  return {
    propriedade: computed(() => dados.value.propriedade),
    lotes: computed(() => dados.value.lotes),
    carregando,
  }
}

export function salvarPropriedade(dados: Omit<Propriedade, 'id' | 'resumo'> & { id?: string }) {
  return useSincronizacao().registrar('propriedade', { ...dados, id: dados.id ?? novoId() })
}
