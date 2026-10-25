import type { Animal, AtendimentoAnimal } from '#shared/types/entidades'
import { formatarData } from './formato'
import { rotuloSituacao } from './rotulos'

/** Uma vaca do atendimento com a sua linha (DG, protocolo, D45). */
export interface VacaRelatorio {
  animal: Animal
  linha?: AtendimentoAnimal
}

const dia = { d7: 'D7', d8: 'D8', d9: 'D9' } as const

/**
 * Tabela do relatório do lote, a mesma no PDF e na planilha. Só entram as vacas avaliadas no DG;
 * as colunas do protocolo só aparecem em atendimento DG + IATF.
 */
export function tabelaRelatorio(vacas: VacaRelatorio[], nomeSemen: Map<string, string>, soDg: boolean) {
  const cabecalho = ['Nº vaca', 'Raça', 'Situação no DG', 'Idade gestacional', 'Destino / motivo']
  if (!soDg) cabecalho.push('Hormônio', 'D10', 'Sêmen', 'Obs. / justificativa', 'D45')

  const linhas = vacas
    .filter(v => v.linha && v.linha.situacaoDg !== 'pendente')
    .map(({ animal, linha: l }) => {
      const linha = [
        animal.numero,
        animal.raca ?? '',
        rotuloSituacao[l!.situacaoDg],
        l!.idadeGestacional ?? '',
        l!.destinoDescarte ?? l!.motivoRefugo ?? '',
      ]
      if (!soDg) {
        // Fora do protocolo (prenha, descarte, refugo) as colunas do IATF ficam vazias
        const emProtocolo = !!l!.emProtocolo
        linha.push(
          emProtocolo && l!.hormonioDia ? dia[l!.hormonioDia] : '',
          !emProtocolo ? '' : l!.inseminada === true ? 'Inseminada' : l!.inseminada === false ? 'Não inseminada' : '',
          (l!.semenId && nomeSemen.get(l!.semenId)) || '',
          l!.justificativaNaoInseminada || l!.obs || '',
          l!.resultadoD45 ? rotuloSituacao[l!.resultadoD45] : '',
        )
      }
      return linha
    })
  return { cabecalho, linhas }
}

/** CSV que o Excel em português abre direto: separador ";", BOM para os acentos. */
export function paraCsv(cabecalho: string[], linhas: string[][], preambulo: string[][] = []): string {
  const celula = (v: string) => (/[";\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)
  const todas = [...preambulo, ...(preambulo.length ? [[]] : []), cabecalho, ...linhas]
  return `﻿${todas.map(l => l.map(celula).join(';')).join('\r\n')}\r\n`
}

/** "IATF Fazenda Boa Vista - Lote 2 - 24-10-2026" vira um nome de arquivo seguro. */
export function nomeArquivo(partes: (string | null | undefined)[], extensao: string): string {
  const base = partes.filter(Boolean).join(' - ')
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .replace(/[^\w\- ]+/g, '').replace(/\s+/g, ' ').trim()
  return `${base || 'relatorio'}.${extensao}`
}

export function baixarArquivo(conteudo: string, nome: string, tipo: string) {
  const url = URL.createObjectURL(new Blob([conteudo], { type: tipo }))
  const a = document.createElement('a')
  a.href = url
  a.download = nome
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const dataArquivo = (data?: string | null) => formatarData(data).replace(/\//g, '-')
