/** Manejos que vencem em todos os lotes (D8, D10, D45), lidos do banco do aparelho. */
export function useAgenda() {
  const { dados: itens, carregando } = useConsulta(() => hoje(), async (dia) => {
    const [atendimentos, lotes, propriedades, linhas] = await Promise.all([
      bancoLocal.atendimentos.toArray(), bancoLocal.lotes.toArray(), bancoLocal.propriedades.toArray(), bancoLocal.atendimentoAnimais.toArray(),
    ])
    const loteDe = new Map(lotes.map(l => [l.id, l]))
    const propriedadeDe = new Map(propriedades.map(p => [p.id, p]))
    const comNomes = atendimentos.map((a) => {
      const lote = loteDe.get(a.loteId)
      return { ...a, lote: lote?.nome ?? '', propriedade: (lote && propriedadeDe.get(lote.propriedadeId)?.nome) ?? '' }
    })
    return montarAgenda(comNomes, linhas, dia)
  }, [] as ItemAgenda[])
  return { itens, carregando }
}
