import type { Animal, Atendimento, AtendimentoAnimal, Lote, Propriedade, SituacaoDg } from '#shared/types/entidades'

export interface VacaNoAtendimento {
  animal: Animal
  linha?: AtendimentoAnimal
}

export function useAtendimento(id: () => string) {
  const { dados, carregando } = useConsulta(id, async (aid) => {
    const atendimento = await bancoLocal.atendimentos.get(aid)
    if (!atendimento) return { atendimento, lote: undefined, propriedade: undefined, vacas: [] }
    const lote = await bancoLocal.lotes.get(atendimento.loteId)
    const [propriedade, animais, linhas] = await Promise.all([
      lote ? bancoLocal.propriedades.get(lote.propriedadeId) : undefined,
      bancoLocal.animais.where('loteId').equals(atendimento.loteId).toArray(),
      bancoLocal.atendimentoAnimais.where('atendimentoId').equals(aid).toArray(),
    ])
    const linhaDe = new Map(linhas.map(l => [l.animalId, l]))
    const vacas: VacaNoAtendimento[] = animais.sort(porNumero).map(animal => ({ animal, linha: linhaDe.get(animal.id) }))
    return { atendimento, lote, propriedade, vacas }
  }, { atendimento: undefined as Atendimento | undefined, lote: undefined as Lote | undefined, propriedade: undefined as Propriedade | undefined, vacas: [] as VacaNoAtendimento[] })

  const atendimento = computed(() => dados.value.atendimento)
  const vacas = computed(() => dados.value.vacas)
  const situacao = (v: VacaNoAtendimento): SituacaoDg => v.linha?.situacaoDg ?? 'pendente'
  const contagem = computed(() => {
    const c: Record<SituacaoDg, number> = { pendente: 0, prenha: 0, vazia: 0, descarte: 0, refugo: 0 }
    for (const v of vacas.value) c[situacao(v)]++
    return c
  })

  function atualizar(campos: Partial<Atendimento>) {
    if (!atendimento.value) return
    return useSincronizacao().registrar('atendimento', { ...campos, id: atendimento.value.id })
  }

  async function atualizarVaca(vaca: VacaNoAtendimento, campos: Partial<AtendimentoAnimal>) {
    // A linha pode ter sido criada há instantes e ainda não ter chegado à tela
    const existente = vaca.linha ?? await bancoLocal.atendimentoAnimais.where('[atendimentoId+animalId]').equals([id(), vaca.animal.id]).first()
    const base: AtendimentoAnimal = existente ? { ...existente } : {
      id: novoId(), atendimentoId: id(), animalId: vaca.animal.id, situacaoDg: 'pendente',
      idadeGestacional: null, destinoDescarte: null, motivoRefugo: null, hormonioDia: null,
      inseminada: null, justificativaNaoInseminada: null, semenId: null, obs: null, resultadoD45: null,
    }
    return useSincronizacao().registrar('atendimentoAnimal', existente ? { ...campos, id: base.id } : { ...base, ...campos })
  }

  return {
    atendimento,
    lote: computed(() => dados.value.lote),
    propriedade: computed(() => dados.value.propriedade),
    vacas,
    contagem,
    situacao,
    carregando,
    atualizar,
    atualizarVaca,
  }
}

export async function iniciarAtendimento(loteId: string, dataD0: string) {
  const atendimento: Atendimento = {
    id: novoId(), loteId, tipo: 'dg_iatf', status: 'dg', dataD0,
    gnrh: null, horaD8: null, horaD10: null, inseminador: null, animaisPerdidos: 0,
  }
  return useSincronizacao().registrar('atendimento', atendimento)
}

export function useAtendimentos() {
  const { dados: atendimentos, carregando } = useConsulta(() => 0, async () => {
    const [lista, lotes, propriedades] = await Promise.all([bancoLocal.atendimentos.toArray(), bancoLocal.lotes.toArray(), bancoLocal.propriedades.toArray()])
    const loteDe = new Map(lotes.map(l => [l.id, l]))
    const propriedadeDe = new Map(propriedades.map(p => [p.id, p]))
    return lista
      .map((a) => {
        const lote = loteDe.get(a.loteId)
        return { ...a, lote: lote?.nome ?? '', propriedadeId: lote?.propriedadeId, propriedade: (lote && propriedadeDe.get(lote.propriedadeId)?.nome) ?? '' }
      })
      .sort((a, b) => b.dataD0.localeCompare(a.dataD0))
  }, [])
  return { atendimentos, carregando }
}
