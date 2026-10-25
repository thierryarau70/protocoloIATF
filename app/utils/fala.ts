import type { SituacaoDg } from '#shared/types/entidades'

/** O que uma frase falada no curral quer dizer: "doze prenha sessenta dias". */
export interface Comando {
  numero?: string
  situacao?: Exclude<SituacaoDg, 'pendente'>
  idadeGestacional?: string
}

const unidades: Record<string, number> = {
  zero: 0, um: 1, uma: 1, dois: 2, duas: 2, tres: 3, quatro: 4, cinco: 5, seis: 6, sete: 7, oito: 8, nove: 9,
  dez: 10, onze: 11, doze: 12, treze: 13, catorze: 14, quatorze: 14, quinze: 15, dezesseis: 16, dezessete: 17,
  dezoito: 18, dezenove: 19, vinte: 20, trinta: 30, quarenta: 40, cinquenta: 50, sessenta: 60, setenta: 70,
  oitenta: 80, noventa: 90, cem: 100, cento: 100, duzentos: 200, duzentas: 200, trezentos: 300, quatrocentos: 400,
  quinhentos: 500, seiscentos: 600, setecentos: 700, oitocentos: 800, novecentos: 900,
}

const situacoes: [RegExp, Exclude<SituacaoDg, 'pendente'>][] = [
  [/^(prenha|prenhe|prenhez|cheia|gestante)$/, 'prenha'],
  [/^(vazia|vazio|solteira)$/, 'vazia'],
  [/^(descarte|descartar|descartada)$/, 'descarte'],
  [/^(refugo|refugar|refugada)$/, 'refugo'],
]

const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()

/**
 * Junta números por extenso em algarismos ("cento e vinte e tres" -> "123", "quatro mil e doze" -> "4012");
 * números já em algarismos passam direto. Devolve uma lista de pedaços: números e palavras.
 */
function tokens(texto: string): (number | string)[] {
  const palavras = normalizar(texto).replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(Boolean)
  const saida: (number | string)[] = []
  let total: number | null = null
  let grupo = 0
  const fechar = () => {
    if (total !== null) saida.push(total + grupo)
    total = null
    grupo = 0
  }
  for (let i = 0; i < palavras.length; i++) {
    const p = palavras[i]!
    if (/^\d+$/.test(p)) { fechar(); saida.push(Number(p)); continue }
    if (p in unidades) { total ??= 0; grupo += unidades[p]!; continue }
    if (p === 'mil') { total = (total ?? 0) + (grupo || 1) * 1000; grupo = 0; continue }
    // "e" só liga números ("vinte e dois"); fora disso é palavra comum
    if (p === 'e' && total !== null && palavras[i + 1] && (palavras[i + 1]! in unidades)) continue
    fechar()
    saida.push(p)
  }
  fechar()
  return saida
}

/** Interpreta uma frase. O primeiro número é a vaca; depois da situação, um número com "dias"/"meses" é a idade. */
export function interpretarFala(texto: string): Comando {
  const lista = tokens(texto)
  const comando: Comando = {}
  for (let i = 0; i < lista.length; i++) {
    const t = lista[i]!
    if (typeof t === 'number') {
      const seguinte = lista[i + 1]
      if (seguinte === 'dias' || seguinte === 'dia' || seguinte === 'meses' || seguinte === 'mes') {
        comando.idadeGestacional = `${t} ${seguinte.startsWith('mes') ? (t === 1 ? 'mês' : 'meses') : (t === 1 ? 'dia' : 'dias')}`
        i++
      }
      else if (comando.numero === undefined) comando.numero = String(t)
      else if (comando.situacao === 'prenha' && !comando.idadeGestacional) comando.idadeGestacional = `${t} dias`
      continue
    }
    if (t === 'vaca' || t === 'numero' || t === 'brinco') continue
    const achada = situacoes.find(([re]) => re.test(t))
    if (achada) comando.situacao = achada[1]
  }
  return comando
}

/** Acha a vaca do lote pelo número falado ou lido: "412" casa com "0412". */
export function acharNumero(numero: string, numerosDoLote: string[]): string | undefined {
  const semZeros = (s: string) => s.replace(/^0+(?=\d)/, '')
  return numerosDoLote.find(n => n === numero) ?? numerosDoLote.find(n => semZeros(n) === semZeros(numero))
}
