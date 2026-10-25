import { and, asc, eq, gt, lt } from 'drizzle-orm'
import { createError } from 'h3'
import { tabelas, useDb } from './db'

export interface Limite { chave: string, maximo: number, janelaMin: number }

export const limites = {
  loginEmail: (email: string): Limite => ({ chave: `login:email:${email}`, maximo: 5, janelaMin: 15 }),
  loginIp: (ip: string): Limite => ({ chave: `login:ip:${ip}`, maximo: 20, janelaMin: 15 }),
  cadastroIp: (ip: string): Limite => ({ chave: `cadastro:ip:${ip}`, maximo: 5, janelaMin: 60 }),
}

/** Minutos até poder tentar de novo, ou null se ainda está dentro do limite. */
export async function minutosBloqueado({ chave, maximo, janelaMin }: Limite, agora = new Date()): Promise<number | null> {
  const db = await useDb()
  const desde = new Date(agora.getTime() - janelaMin * 60_000)
  const tentativas = await db.select({ criadoEm: tabelas.tentativaAcesso.criadoEm })
    .from(tabelas.tentativaAcesso)
    .where(and(eq(tabelas.tentativaAcesso.chave, chave), gt(tabelas.tentativaAcesso.criadoEm, desde)))
    .orderBy(asc(tabelas.tentativaAcesso.criadoEm))
  if (tentativas.length < maximo) return null
  // Libera quando a tentativa que estourou o limite sair da janela
  const libera = tentativas[tentativas.length - maximo]!.criadoEm.getTime() + janelaMin * 60_000
  return Math.max(1, Math.ceil((libera - agora.getTime()) / 60_000))
}

export async function registrarTentativa(chaves: string[], agora = new Date()) {
  const db = await useDb()
  await db.insert(tabelas.tentativaAcesso).values(chaves.map(chave => ({ chave, criadoEm: agora })))
  // Faxina: nada aqui precisa de mais de um dia
  await db.delete(tabelas.tentativaAcesso).where(lt(tabelas.tentativaAcesso.criadoEm, new Date(agora.getTime() - 24 * 60 * 60_000)))
}

export async function limparTentativas(chave: string) {
  const db = await useDb()
  await db.delete(tabelas.tentativaAcesso).where(eq(tabelas.tentativaAcesso.chave, chave))
}

/** Bloqueia com 429 se qualquer um dos limites estourou. */
export async function exigirDentroDoLimite(...lista: Limite[]) {
  for (const limite of lista) {
    const minutos = await minutosBloqueado(limite)
    if (minutos) {
      throw createError({ statusCode: 429, message: `Muitas tentativas. Tente de novo em ${minutos} ${minutos === 1 ? 'minuto' : 'minutos'}.` })
    }
  }
}
