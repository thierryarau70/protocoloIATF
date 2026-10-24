import type { PrenhezPorSemen, SituacaoDg } from '#shared/types/entidades'

/**
 * Regras de negócio do protocolo IATF. Ficam só no servidor: o aparelho guarda e envia,
 * e recebe de volta os valores calculados aqui.
 */

export type TipoAtendimento = 'dg_iatf' | 'so_dg'

/** Duração média da gestação bovina usada na previsão de parto das vacas emprenhadas no IATF. */
export const DIAS_GESTACAO = 283

export function somarDias(data: string, dias: number): string {
  const d = new Date(`${data}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

/** D8 = D0 + 8 (janela D7 a D9), D10 = D0 + 10, D45 = D10 + 45. */
export function calcularDatas(dataD0: string) {
  const dataD10 = somarDias(dataD0, 10)
  return {
    dataD8: somarDias(dataD0, 8),
    dataD10,
    dataD45: somarDias(dataD10, 45),
  }
}

/** Só vaca com DG "vazia" entra no protocolo, e só em atendimento DG + IATF. */
export function entraNoProtocolo(tipo: TipoAtendimento, situacao: SituacaoDg): boolean {
  return tipo === 'dg_iatf' && situacao === 'vazia'
}

export function previsaoPartoIatf(dataD10: string): string {
  return somarDias(dataD10, DIAS_GESTACAO)
}

interface LinhaAnimal {
  situacaoDg: SituacaoDg
  emProtocolo: boolean
  inseminada: boolean | null
  justificativaNaoInseminada: string | null
  hormonioDia: string | null
  resultadoD45: string | null
  semen?: string | null
}

/**
 * Calcula se a vaca está no protocolo e limpa o que não se aplica:
 * fora do protocolo não há hormônio, inseminação nem D45; D45 e sêmen só para inseminada.
 */
export function normalizarLinhaAnimal<T extends Omit<LinhaAnimal, 'emProtocolo'>>(tipo: TipoAtendimento, linha: T): T & { emProtocolo: boolean } {
  const emProtocolo = entraNoProtocolo(tipo, linha.situacaoDg)
  if (!emProtocolo) {
    return { ...linha, emProtocolo, hormonioDia: null, inseminada: null, justificativaNaoInseminada: null, resultadoD45: null, semen: null }
  }
  return {
    ...linha,
    emProtocolo,
    justificativaNaoInseminada: linha.inseminada === false ? linha.justificativaNaoInseminada : null,
    resultadoD45: linha.inseminada === true ? linha.resultadoD45 : null,
    semen: linha.inseminada === true ? linha.semen : null,
  }
}

/** Devolve a mensagem de erro, ou null se a linha é válida. */
export function validarLinhaAnimal(linha: LinhaAnimal): string | null {
  if (linha.inseminada === false && !linha.justificativaNaoInseminada?.trim()) {
    return 'Vaca não inseminada exige justificativa.'
  }
  return null
}

/** Porcentagem com uma casa decimal; null quando não há base para calcular. */
export function taxa(parte: number, total: number): number | null {
  return total > 0 ? Math.round((parte / total) * 1000) / 10 : null
}

/** Quantos sêmens aparecem no gráfico; os demais somam em "Outros". */
export const MAX_SEMENS_GRAFICO = 8

/**
 * Taxa de prenhez no D45 por sêmen, entre as vacas inseminadas.
 * O nome é comparado sem diferenciar maiúsculas e espaços nas pontas; vale a grafia mais usada.
 */
export function prenhezPorSemen(linhas: LinhaAnimal[]): PrenhezPorSemen[] {
  const grupos = new Map<string, { nomes: Map<string, number>, inseminadas: number, prenhas: number }>()
  for (const l of linhas) {
    if (l.inseminada !== true) continue
    const nome = l.semen?.trim() ?? ''
    const chave = nome.toLowerCase()
    const g = grupos.get(chave) ?? { nomes: new Map(), inseminadas: 0, prenhas: 0 }
    g.nomes.set(nome, (g.nomes.get(nome) ?? 0) + 1)
    g.inseminadas++
    if (l.resultadoD45 === 'prenha') g.prenhas++
    grupos.set(chave, g)
  }

  const linha = (rotulo: string, tipo: PrenhezPorSemen['tipo'], inseminadas: number, prenhas: number): PrenhezPorSemen =>
    ({ rotulo, tipo, inseminadas, prenhas, taxaPrenhez: taxa(prenhas, inseminadas) })
  const maisUsado = (nomes: Map<string, number>) => [...nomes].sort((a, b) => b[1] - a[1])[0]![0]
  // Mais usados primeiro; empate em ordem alfabética, para o gráfico não trocar de ordem sozinho
  const informados = [...grupos].filter(([chave]) => chave)
    .map(([, g]) => ({ ...g, rotulo: maisUsado(g.nomes) }))
    .sort((a, b) => b.inseminadas - a.inseminadas || a.rotulo.localeCompare(b.rotulo, 'pt-BR'))

  const resultado = informados.slice(0, MAX_SEMENS_GRAFICO).map(g => linha(g.rotulo, 'semen', g.inseminadas, g.prenhas))
  const resto = informados.slice(MAX_SEMENS_GRAFICO)
  if (resto.length) {
    resultado.push(linha('Outros', 'outros', resto.reduce((s, g) => s + g.inseminadas, 0), resto.reduce((s, g) => s + g.prenhas, 0)))
  }
  const semNome = grupos.get('')
  if (semNome) resultado.push(linha('Não informado', 'nao_informado', semNome.inseminadas, semNome.prenhas))
  return resultado
}

/**
 * Resultado de um atendimento.
 * Taxa de inseminação = inseminadas ÷ total de vacas do lote.
 * Taxa de prenhez = prenhas no D45 ÷ inseminadas.
 */
export function calcularResultado(linhas: LinhaAnimal[], totalVacasLote: number) {
  const contar = (f: (l: LinhaAnimal) => boolean) => linhas.filter(f).length
  const inseminadas = contar(l => l.inseminada === true)
  const prenhasD45 = contar(l => l.resultadoD45 === 'prenha')
  return {
    dg: {
      prenha: contar(l => l.situacaoDg === 'prenha'),
      vazia: contar(l => l.situacaoDg === 'vazia'),
      descarte: contar(l => l.situacaoDg === 'descarte'),
      refugo: contar(l => l.situacaoDg === 'refugo'),
      pendente: contar(l => l.situacaoDg === 'pendente'),
    },
    emProtocolo: contar(l => l.emProtocolo),
    inseminadas,
    naoInseminadas: contar(l => l.inseminada === false),
    prenhasD45,
    vaziasD45: contar(l => l.resultadoD45 === 'vazia'),
    taxaInseminacao: taxa(inseminadas, totalVacasLote),
    taxaPrenhez: taxa(prenhasD45, inseminadas),
    semen: prenhezPorSemen(linhas),
  }
}
