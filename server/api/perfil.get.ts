import { eq } from 'drizzle-orm'
import type { Perfil } from '#shared/types/entidades'

export default defineEventHandler(async (event): Promise<Perfil> => {
  const vetId = await veterinarioDaSessao(event)
  const db = await useDb()
  const [vet] = await db.select().from(tabelas.veterinario).where(eq(tabelas.veterinario.id, vetId))
  if (!vet) throw createError({ statusCode: 404, message: 'Veterinário não encontrado.' })

  const { propriedades, atendimentos } = await montarSnapshot(vetId)
  const iatf = atendimentos.filter(a => a.tipo === 'dg_iatf' && a.status !== 'dg')
  const porAno = new Map<number, number>()
  for (const a of iatf) {
    const ano = Number(a.dataD0.slice(0, 4))
    porAno.set(ano, (porAno.get(ano) ?? 0) + 1)
  }
  const inseminadas = iatf.reduce((s, a) => s + (a.resultado?.inseminadas ?? 0), 0)
  const prenhas = iatf.reduce((s, a) => s + (a.resultado?.prenhasD45 ?? 0), 0)

  return {
    nome: vet.nome,
    email: vet.email,
    crmv: vet.crmv,
    empresa: vet.empresa,
    local: vet.local,
    logoUrl: vet.logoUrl,
    contato: vet.contato,
    resumo: {
      propriedades: propriedades.length,
      iatfPorAno: [...porAno].map(([ano, total]) => ({ ano, total })).sort((a, b) => a.ano - b.ano),
      taxaPrenhez: inseminadas ? Math.round((prenhas / inseminadas) * 1000) / 10 : null,
    },
  }
})
