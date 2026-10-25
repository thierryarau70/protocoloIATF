import type { Insumo } from '#shared/types/entidades'

export function useInsumo(id: () => string) {
  const { dados: insumo } = useConsulta(id, iid => bancoLocal.insumos.get(iid), undefined as Insumo | undefined)
  return insumo
}

export function salvarInsumo(dados: Omit<Insumo, 'id'> & { id?: string }) {
  return useSincronizacao().registrar('insumo', { ...dados, id: dados.id ?? novoId() })
}

/** Sugestões do protocolo IATF; o veterinário ajusta o gasto por vaca ao produto que usa. */
export const insumosComuns = [
  { nome: 'Implante de progesterona', unidade: 'unidades', usoPorVaca: 1 },
  { nome: 'Benzoato de estradiol', unidade: 'mL', usoPorVaca: 2 },
  { nome: 'Prostaglandina (PGF2α)', unidade: 'mL', usoPorVaca: 2 },
  { nome: 'Cipionato de estradiol', unidade: 'mL', usoPorVaca: 0.5 },
  { nome: 'eCG', unidade: 'mL', usoPorVaca: 1.5 },
  { nome: 'GnRH', unidade: 'mL', usoPorVaca: 2.5 },
]
