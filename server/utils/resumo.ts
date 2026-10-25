import type { ResumoVeterinario, Snapshot } from '#shared/types/entidades'
import { prenhezPorSemen, taxa } from './regras'

/**
 * Resumo do perfil. Conta como IATF o atendimento DG + IATF que passou do DG;
 * as taxas usam só os finalizados, porque antes do D45 a prenhez ainda não é conhecida.
 */
export function resumirVeterinario({ propriedades, semens, atendimentos, atendimentoAnimais }: Snapshot): ResumoVeterinario {
  const iatf = atendimentos.filter(a => a.tipo === 'dg_iatf' && a.status !== 'dg')
  const finalizados = iatf.filter(a => a.status === 'finalizado')
  const somar = (campo: 'inseminadas' | 'prenhasD45') => finalizados.reduce((s, a) => s + (a.resultado?.[campo] ?? 0), 0)

  const porAno = new Map<number, number>()
  for (const a of iatf) {
    const ano = Number(a.dataD0.slice(0, 4))
    porAno.set(ano, (porAno.get(ano) ?? 0) + 1)
  }

  const idsFinalizados = new Set(finalizados.map(a => a.id))
  const linhasFinalizadas = atendimentoAnimais.filter(l => idsFinalizados.has(l.atendimentoId))

  return {
    propriedades: propriedades.length,
    iatfPorAno: [...porAno].map(([ano, total]) => ({ ano, total })).sort((a, b) => a.ano - b.ano),
    taxaPrenhez: taxa(somar('prenhasD45'), somar('inseminadas')),
    semen: prenhezPorSemen(linhasFinalizadas.map(nomearSemen(semens)).map(l => ({ ...l, emProtocolo: l.emProtocolo ?? false }))),
  }
}

/** Acrescenta o nome do sêmen à linha da vaca, para o gráfico de prenhez por sêmen. */
export function nomearSemen(semens: { id: string, nome: string }[]) {
  const nomes = new Map(semens.map(s => [s.id, s.nome]))
  return <T extends { semenId?: string | null }>(l: T) => ({ ...l, semen: l.semenId ? nomes.get(l.semenId) ?? null : null })
}
