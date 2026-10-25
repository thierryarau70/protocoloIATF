import type { Semen } from '#shared/types/entidades'

export function useSemens(propriedadeId: () => string | undefined) {
  const { dados: semens, carregando } = useConsulta(propriedadeId, async pid =>
    pid ? (await bancoLocal.semens.where('propriedadeId').equals(pid).toArray()).sort(porNome) : [], [] as Semen[])
  return { semens, carregando }
}

export function useSemen(id: () => string) {
  const { dados: semen } = useConsulta(id, sid => bancoLocal.semens.get(sid), undefined as Semen | undefined)
  return semen
}

export function salvarSemen(dados: Omit<Semen, 'id'> & { id?: string }) {
  return useSincronizacao().registrar('semen', { ...dados, id: dados.id ?? novoId() })
}

/** "Nelore · ABS 123": raça e partida, quando informadas. */
export function detalheSemen(s: Pick<Semen, 'raca' | 'partida'>) {
  return [s.raca, s.partida].filter(Boolean).join(' · ')
}
