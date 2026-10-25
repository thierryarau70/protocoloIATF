/** Relatório do lote para o fazendeiro: os mesmos dados no PDF (página para imprimir) e na planilha. */
export function useRelatorio(id: () => string) {
  const { atendimento, lote, propriedade, vacas } = useAtendimento(id)
  const { semens } = useSemens(() => propriedade.value?.id)
  const { perfil, carregar } = usePerfil()
  carregar()

  const soDg = computed(() => atendimento.value?.tipo === 'so_dg')
  const nomeSemen = computed(() => new Map(semens.value.map(s => [s.id, s.nome])))
  const tabela = computed(() => tabelaRelatorio(vacas.value, nomeSemen.value, soDg.value))
  const titulo = computed(() => (soDg.value ? 'Relatório de DG' : 'Relatório IATF'))
  // Antes do DG final a taxa de prenhez sairia 0%, o que engana quem lê
  const taxaPrenhez = computed(() => {
    const r = atendimento.value?.resultado
    return r && r.prenhasD45 + r.vaziasD45 > 0 ? formatarTaxa(r.taxaPrenhez) : 'aguardando D45'
  })

  function baixarPlanilha() {
    const a = atendimento.value
    if (!a) return
    const r = a.resultado
    const preambulo = [
      [titulo.value],
      ['Propriedade', propriedade.value?.nome ?? ''],
      ['Proprietário', propriedade.value?.proprietario ?? ''],
      ['Lote', lote.value?.nome ?? ''],
      ['Data do DG (D0)', formatarData(a.dataD0)],
      ...(soDg.value ? [] : [
        ['Inseminador', a.inseminador ?? ''],
        ['Taxa de inseminação', formatarTaxa(r?.taxaInseminacao)],
        ['Taxa de prenhez', taxaPrenhez.value],
      ]),
      ['Veterinário', [perfil.value?.nome, perfil.value?.crmv && `CRMV ${perfil.value.crmv}`].filter(Boolean).join(' · ')],
    ]
    const { cabecalho, linhas } = tabela.value
    const nome = nomeArquivo([soDg.value ? 'DG' : 'IATF', propriedade.value?.nome, lote.value?.nome, dataArquivo(a.dataD0)], 'csv')
    baixarArquivo(paraCsv(cabecalho, linhas, preambulo), nome, 'text/csv;charset=utf-8')
  }

  return { atendimento, lote, propriedade, perfil, soDg, tabela, titulo, taxaPrenhez, baixarPlanilha }
}
