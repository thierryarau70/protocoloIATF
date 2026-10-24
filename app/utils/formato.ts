export function hoje(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function formatarData(data?: string | null): string {
  if (!data) return '—'
  const [a, m, d] = data.split('-')
  return `${d}/${m}/${a}`
}

export function formatarTaxa(taxa?: number | null): string {
  return taxa === null || taxa === undefined ? '—' : `${taxa.toLocaleString('pt-BR')}%`
}

export function plural(n: number, singular: string, pluralForma = `${singular}s`): string {
  return `${n} ${n === 1 ? singular : pluralForma}`
}

/** Campo numérico de contagem: vazio ou inválido vira null (não informado). */
export function inteiroOuNulo(valor: string | number): number | null {
  const n = Number(valor)
  return valor === '' || !Number.isInteger(n) || n < 0 ? null : n
}

export function novoId(): string {
  return crypto.randomUUID()
}

export function porNumero<T extends { numero: string }>(a: T, b: T): number {
  return a.numero.localeCompare(b.numero, 'pt-BR', { numeric: true })
}

export function porNome<T extends { nome: string }>(a: T, b: T): number {
  return a.nome.localeCompare(b.nome, 'pt-BR')
}

export function contem(texto: string | null | undefined, busca: string): boolean {
  const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase()
  return normalizar(texto ?? '').includes(normalizar(busca.trim()))
}
