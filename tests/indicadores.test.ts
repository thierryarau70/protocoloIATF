import { describe, expect, it } from 'vitest'
import type { Animal, Atendimento, AtendimentoAnimal, Insumo, Lote, Semen } from '#shared/types/entidades'
import {
  agrupar, estoqueInsumo, estoqueSemen, partosPrevistos, rankingTouros, resultadosIatf, resumoReprodutivo, vacasProblema,
} from '../app/utils/indicadores'

const lote = (id: string, propriedadeId = 'p1', nome = `Lote ${id}`): Lote => ({ id, propriedadeId, nome, localPrincipal: null })
const vaca = (id: string, loteId = 'l1', extra: Partial<Animal> = {}) => ({ id, loteId, numero: id, previsaoParto: null, ...extra }) as Animal
const at = (id: string, dataD0: string, extra: Partial<Atendimento> = {}): Atendimento => ({
  id, loteId: 'l1', tipo: 'dg_iatf', status: 'finalizado', dataD0, gnrh: null, horaD8: null, horaD10: null,
  inseminador: null, animaisPerdidos: 0, ...extra,
})
let n = 0
const linha = (atendimentoId: string, animalId: string, extra: Partial<AtendimentoAnimal> = {}) =>
  ({ id: `x${++n}`, atendimentoId, animalId, situacaoDg: 'vazia', emProtocolo: true, ...extra }) as AtendimentoAnimal
const semen = (id: string, nome: string, propriedadeId = 'p1', extra: Partial<Semen> = {}) =>
  ({ id, propriedadeId, nome, raca: null, partida: null, ...extra }) as Semen
const resultado = (inseminadas: number, prenhasD45: number) => ({ inseminadas, prenhasD45 }) as Atendimento['resultado']

describe('estoque', () => {
  const ats = [at('a1', '2026-09-01'), at('a2', '2026-10-01')] // D10: 11/09 e 11/10
  const linhas = [
    linha('a1', 'v1', { inseminada: true, semenId: 's1' }),
    linha('a2', 'v2', { inseminada: true, semenId: 's1' }),
    linha('a2', 'v3', { inseminada: true, semenId: 's1' }),
    linha('a2', 'v4', { inseminada: false, semenId: 's1' }),
    linha('a2', 'v5', { situacaoDg: 'prenha', emProtocolo: false }),
  ]

  it('sêmen desconta só as inseminações desde a contagem', () => {
    expect(estoqueSemen(semen('s1', 'A', 'p1', { estoqueDoses: 10, estoqueEm: '2026-10-01', estoqueMinimo: 8 }), ats, linhas))
      .toEqual({ restante: 8, usado: 2, baixo: true })
    expect(estoqueSemen(semen('s1', 'A', 'p1', { estoqueDoses: 10, estoqueEm: '2026-01-01' }), ats, linhas))
      .toEqual({ restante: 7, usado: 3, baixo: false })
    expect(estoqueSemen(semen('s1', 'A'), ats, linhas)).toBeNull()
  })

  it('hormônio desconta o gasto por vaca que entrou em protocolo', () => {
    const benzoato = { id: 'i1', nome: 'Benzoato', unidade: 'mL', saldo: 50, saldoEm: '2026-09-15', usoPorVaca: 2, minimo: 45 } as Insumo
    // Só o atendimento de 01/10 conta: 3 vacas em protocolo (a prenha ficou de fora), 2 mL cada
    expect(estoqueInsumo(benzoato, ats, linhas)).toEqual({ restante: 44, usado: 6, baixo: true })
    expect(estoqueInsumo({ ...benzoato, usoPorVaca: null }, ats, linhas)).toEqual({ restante: 50, usado: 0, baixo: false })
  })
})

describe('painel da fazenda', () => {
  const lotes = [lote('l1'), lote('l2')]
  const ats = [
    at('a1', '2026-03-01', { inseminador: 'Carlos', resultado: resultado(10, 5) }),
    at('a2', '2026-06-01', { loteId: 'l2', inseminador: 'Ana', resultado: resultado(20, 14) }),
    at('a3', '2026-01-01', { inseminador: 'Carlos', resultado: resultado(10, 3) }),
    at('a4', '2026-07-01', { status: 'protocolo', resultado: resultado(8, 0) }),
    at('a5', '2026-07-01', { loteId: 'outra-fazenda', resultado: resultado(8, 8) }),
  ]

  it('um ponto por IATF finalizado da fazenda, em ordem de data', () => {
    expect(resultadosIatf(ats, lotes).map(r => [r.data, r.lote, r.taxa])).toEqual([
      ['2026-01-01', 'Lote l1', 30], ['2026-03-01', 'Lote l1', 50], ['2026-06-01', 'Lote l2', 70],
    ])
  })

  it('agrupa por lote e por inseminador somando antes de dividir', () => {
    const r = resultadosIatf(ats, lotes)
    expect(agrupar(r, x => x.lote)).toEqual([
      { rotulo: 'Lote l2', iatf: 1, inseminadas: 20, prenhas: 14, taxa: 70 },
      { rotulo: 'Lote l1', iatf: 2, inseminadas: 20, prenhas: 8, taxa: 40 },
    ])
    expect(agrupar(r, x => x.inseminador ?? 'Não informado').map(g => [g.rotulo, g.taxa])).toEqual([['Ana', 70], ['Carlos', 40]])
  })
})

describe('ranking de touros', () => {
  const lotes = [lote('l1', 'p1'), lote('l2', 'p2')]
  const semens = [semen('s1', 'Touro Faísca', 'p1'), semen('s2', 'touro faisca ', 'p2'), semen('s3', 'Bravo', 'p1')]
  const ats = [at('a1', '2026-02-01'), at('a2', '2026-08-01', { loteId: 'l2' }), at('a3', '2026-08-01', { status: 'protocolo' })]
  const linhas = [
    linha('a1', 'v1', { inseminada: true, semenId: 's1', resultadoD45: 'prenha' }),
    linha('a1', 'v2', { inseminada: true, semenId: 's1', resultadoD45: 'vazia' }),
    linha('a2', 'v3', { inseminada: true, semenId: 's2', resultadoD45: 'prenha' }),
    linha('a2', 'v4', { inseminada: true, semenId: 's2', resultadoD45: 'prenha' }),
    linha('a1', 'v5', { inseminada: true, semenId: 's3', resultadoD45: 'prenha' }),
    linha('a3', 'v6', { inseminada: true, semenId: 's3', resultadoD45: 'vazia' }),
  ]

  it('junta o mesmo touro de fazendas diferentes pelo nome', () => {
    expect(rankingTouros(semens, lotes, ats, linhas)).toEqual([
      { nome: 'Bravo', inseminadas: 1, prenhas: 1, taxa: 100, fazendas: 1 },
      { nome: 'Touro Faísca', inseminadas: 4, prenhas: 3, taxa: 75, fazendas: 2 },
    ])
  })

  it('filtra por fazenda, período e mínimo de inseminações', () => {
    expect(rankingTouros(semens, lotes, ats, linhas, { propriedadeId: 'p2' }).map(t => [t.nome, t.inseminadas])).toEqual([['touro faisca ', 2]])
    expect(rankingTouros(semens, lotes, ats, linhas, { desde: '2026-06-01' }).map(t => t.nome)).toEqual(['touro faisca '])
    expect(rankingTouros(semens, lotes, ats, linhas, { minimo: 2 }).map(t => t.nome)).toEqual(['Touro Faísca'])
  })
})

describe('vacas', () => {
  const ats = [at('a1', '2026-01-01'), at('a2', '2026-04-01'), at('a3', '2026-07-01'), at('a4', '2026-09-01', { status: 'protocolo' })]
  const linhas = [
    linha('a1', 'v1', { inseminada: true, resultadoD45: 'prenha' }),
    linha('a2', 'v1', { inseminada: true, resultadoD45: 'vazia' }),
    linha('a3', 'v1', { inseminada: false, justificativaNaoInseminada: 'cio' }),
    linha('a4', 'v1', { inseminada: true }),
    linha('a2', 'v2', { inseminada: true, resultadoD45: 'vazia' }),
    linha('a3', 'v2', { inseminada: true, resultadoD45: 'prenha' }),
    linha('a1', 'v3', { situacaoDg: 'prenha', emProtocolo: false }),
  ]

  it('resumo conta protocolos finalizados, falhas e as seguidas do fim', () => {
    const passagens = linhas.filter(l => l.animalId === 'v1').map(l => ({ linha: l, atendimento: ats.find(a => a.id === l.atendimentoId)! }))
    expect(resumoReprodutivo(passagens)).toEqual({ dgs: 4, protocolos: 3, inseminacoes: 2, prenhezesD45: 1, falhas: 2, falhasSeguidas: 2, taxa: 50 })
  })

  it('vacas-problema: 2 ou mais falhas seguidas', () => {
    expect(vacasProblema([vaca('v1'), vaca('v2'), vaca('v3')], [lote('l1')], ats, linhas)).toEqual([
      { animalId: 'v1', numero: 'v1', lote: 'Lote l1', falhas: 2, falhasSeguidas: 2, protocolos: 3 },
    ])
  })
})

describe('partos previstos', () => {
  it('agrupa por mês a partir do mês atual, com a previsão mais recente da vaca', () => {
    const ats = [at('a1', '2026-03-01', { previsaoParto: '2026-12-20' }), at('a2', '2025-01-01', { previsaoParto: '2025-10-20' })]
    const linhas = [
      linha('a1', 'v1', { inseminada: true, resultadoD45: 'prenha' }),
      linha('a2', 'v2', { inseminada: true, resultadoD45: 'prenha' }),
    ]
    const animais = [
      vaca('v1'),
      vaca('v2', 'l1', { previsaoParto: '2027-01-05' }), // IATF antigo, previsão nova anotada no DG
      vaca('v3', 'l1', { previsaoParto: '2026-12-01' }),
      vaca('v4', 'l1', { previsaoParto: '2026-09-01' }), // já passou
    ]
    expect(partosPrevistos(animais, [lote('l1')], ats, linhas, '2026-10-25')).toEqual([
      { mes: '2026-12', partos: [
        { animalId: 'v3', numero: 'v3', lote: 'Lote l1', data: '2026-12-01', origem: 'dg' },
        { animalId: 'v1', numero: 'v1', lote: 'Lote l1', data: '2026-12-20', origem: 'iatf' },
      ] },
      { mes: '2027-01', partos: [{ animalId: 'v2', numero: 'v2', lote: 'Lote l1', data: '2027-01-05', origem: 'dg' }] },
    ])
  })
})
