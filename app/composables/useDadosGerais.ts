import type { Animal, Atendimento, AtendimentoAnimal, Insumo, Lote, Propriedade, Semen } from '#shared/types/entidades'

export interface DadosGerais {
  propriedades: Propriedade[]
  lotes: Lote[]
  semens: Semen[]
  animais: Animal[]
  atendimentos: Atendimento[]
  linhas: AtendimentoAnimal[]
  insumos: Insumo[]
}

const vazio: DadosGerais = { propriedades: [], lotes: [], semens: [], animais: [], atendimentos: [], linhas: [], insumos: [] }

/** Tudo o que está no aparelho, para os indicadores (painel, touros, estoque). Atualiza sozinho. */
export function useDadosGerais() {
  const { dados, carregando } = useConsulta(() => 0, async () => {
    const [propriedades, lotes, semens, animais, atendimentos, linhas, insumos] = await Promise.all([
      bancoLocal.propriedades.toArray(), bancoLocal.lotes.toArray(), bancoLocal.semens.toArray(), bancoLocal.animais.toArray(),
      bancoLocal.atendimentos.toArray(), bancoLocal.atendimentoAnimais.toArray(), bancoLocal.insumos.toArray(),
    ])
    return { propriedades: propriedades.sort(porNome), lotes, semens, animais, atendimentos, linhas, insumos: insumos.sort(porNome) }
  }, vazio)
  return { dados, carregando }
}

/** Itens de estoque abaixo do mínimo: hormônios do veterinário e sêmen de cada fazenda. */
export function useEstoqueBaixo() {
  const { dados } = useDadosGerais()
  return computed(() => {
    const d = dados.value
    const nomeFazenda = new Map(d.propriedades.map(p => [p.id, p.nome]))
    const insumos = d.insumos
      .map(i => ({ id: i.id, nome: i.nome, unidade: i.unidade, situacao: estoqueInsumo(i, d.atendimentos, d.linhas), link: `/estoque/${i.id}` }))
      .filter(i => i.situacao.baixo)
    const semens = d.semens
      .map(s => ({ id: s.id, nome: `${s.nome} · ${nomeFazenda.get(s.propriedadeId) ?? ''}`, unidade: 'doses', situacao: estoqueSemen(s, d.atendimentos, d.linhas), link: `/propriedades/${s.propriedadeId}/semen/${s.id}` }))
      .filter((s): s is typeof s & { situacao: SituacaoEstoque } => !!s.situacao?.baixo)
    return [...insumos, ...semens]
  })
}
