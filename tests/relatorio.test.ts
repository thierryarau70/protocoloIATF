import { describe, expect, it } from 'vitest'
import type { Animal, AtendimentoAnimal } from '#shared/types/entidades'
import { nomeArquivo, paraCsv, tabelaRelatorio } from '../app/utils/relatorio'

const vaca = (numero: string, linha?: Partial<AtendimentoAnimal>, raca: string | null = 'Nelore') => ({
  animal: { id: numero, loteId: 'l', numero, raca } as Animal,
  linha: linha && ({ id: `x${numero}`, atendimentoId: 'a', animalId: numero, situacaoDg: 'pendente', ...linha } as AtendimentoAnimal),
})

const semens = new Map([['s1', 'Touro A']])

describe('relatório do lote', () => {
  const vacas = [
    vaca('10', { situacaoDg: 'vazia', emProtocolo: true, hormonioDia: 'd8', inseminada: true, semenId: 's1', resultadoD45: 'prenha' }),
    vaca('11', { situacaoDg: 'vazia', emProtocolo: true, hormonioDia: 'd9', inseminada: false, justificativaNaoInseminada: 'Sem cio' }),
    vaca('12', { situacaoDg: 'prenha', idadeGestacional: '60 dias' }),
    vaca('13', { situacaoDg: 'descarte', destinoDescarte: 'Abate' }, null),
    vaca('14', { situacaoDg: 'pendente' }),
    vaca('15'),
  ]

  it('DG + IATF: uma linha por vaca avaliada, com o protocolo', () => {
    const { cabecalho, linhas } = tabelaRelatorio(vacas, semens, false)
    expect(cabecalho).toHaveLength(10)
    expect(linhas.map(l => l[0])).toEqual(['10', '11', '12', '13'])
    expect(linhas[0]).toEqual(['10', 'Nelore', 'Vazia', '', '', 'D8', 'Inseminada', 'Touro A', '', 'Prenha'])
    expect(linhas[1]!.slice(5)).toEqual(['D9', 'Não inseminada', '', 'Sem cio', ''])
    // Prenha no DG não entra no protocolo: colunas do IATF vazias
    expect(linhas[2]).toEqual(['12', 'Nelore', 'Prenha', '60 dias', '', '', '', '', '', ''])
    expect(linhas[3]!.slice(0, 5)).toEqual(['13', '', 'Descarte', '', 'Abate'])
  })

  it('Só DG: sem as colunas do protocolo', () => {
    const { cabecalho, linhas } = tabelaRelatorio(vacas, semens, true)
    expect(cabecalho).toEqual(['Nº vaca', 'Raça', 'Situação no DG', 'Idade gestacional', 'Destino / motivo'])
    expect(linhas.every(l => l.length === 5)).toBe(true)
  })

  it('CSV abre no Excel: BOM, ";" e aspas quando preciso', () => {
    const csv = paraCsv(['Nº', 'Obs.'], [['1', 'disse "sim"; voltou']], [['Fazenda', 'Boa Vista']])
    expect(csv.startsWith('﻿')).toBe(true)
    expect(csv).toBe('﻿Fazenda;Boa Vista\r\n\r\nNº;Obs.\r\n1;"disse ""sim""; voltou"\r\n')
  })

  it('nome de arquivo sem acento nem barra', () => {
    expect(nomeArquivo(['IATF', 'Fazenda São João', 'Lote 1/A', '24-10-2026'], 'csv')).toBe('IATF - Fazenda Sao Joao - Lote 1A - 24-10-2026.csv')
  })
})
