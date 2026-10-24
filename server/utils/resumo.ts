import type { PrenhezPorSemen, ResumoVeterinario, Snapshot } from '#shared/types/entidades'
import { taxa } from './regras'

const ordemSemen: PrenhezPorSemen['tipo'][] = ['particular', 'misto', null]

/** Resumo do perfil: só conta como IATF o atendimento DG + IATF que passou do DG. */
export function resumirVeterinario({ propriedades, lotes, atendimentos }: Snapshot): ResumoVeterinario {
  const iatf = atendimentos.filter(a => a.tipo === 'dg_iatf' && a.status !== 'dg')
  const somar = (lista: typeof iatf, campo: 'inseminadas' | 'prenhasD45') => lista.reduce((s, a) => s + (a.resultado?.[campo] ?? 0), 0)

  const porAno = new Map<number, number>()
  for (const a of iatf) {
    const ano = Number(a.dataD0.slice(0, 4))
    porAno.set(ano, (porAno.get(ano) ?? 0) + 1)
  }

  // Gráfico de sêmen: agrupa pelo tipo de sêmen da propriedade (não há sêmen por inseminação)
  const semenDaPropriedade = new Map(propriedades.map(p => [p.id, p.semenTipo]))
  const semenDoLote = new Map(lotes.map(l => [l.id, semenDaPropriedade.get(l.propriedadeId) ?? null]))
  const semen = ordemSemen
    .map((tipo) => {
      const grupo = iatf.filter(a => (semenDoLote.get(a.loteId) ?? null) === tipo)
      const inseminadas = somar(grupo, 'inseminadas')
      const prenhas = somar(grupo, 'prenhasD45')
      return { tipo, iatf: grupo.length, inseminadas, prenhas, taxaPrenhez: taxa(prenhas, inseminadas) }
    })
    .filter(g => g.iatf > 0)

  return {
    propriedades: propriedades.length,
    iatfPorAno: [...porAno].map(([ano, total]) => ({ ano, total })).sort((a, b) => a.ano - b.ano),
    taxaPrenhez: taxa(somar(iatf, 'prenhasD45'), somar(iatf, 'inseminadas')),
    semen,
  }
}
