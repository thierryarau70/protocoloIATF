/**
 * De qual tela cada tela foi aberta. O navegador já guarda isso no histórico, mas perde quando o
 * app recarrega a página (versão nova, ou o celular reabrindo o app): aí o "Voltar" caía no
 * destino fixo. Guardado na sessão da aba, sobrevive ao recarregamento.
 */
const chave = (caminho: string) => `origem:${caminho}`

export function guardarOrigem(para: string, de: string) {
  if (para === de) return
  try { sessionStorage.setItem(chave(para), de) }
  catch { /* sem armazenamento: fica só o histórico do navegador */ }
}

export function lerOrigem(para: string): string | null {
  try { return sessionStorage.getItem(chave(para)) }
  catch { return null }
}

const sem = (url: string) => url.split(/[?#]/)[0]!

/** Nome curto da tela para o botão Voltar */
export function nomeDaTela(url: string): string {
  const c = sem(url)
  if (c === '/') return 'Início'
  if (c === '/lotes') return 'Lotes'
  if (c === '/iatf') return 'IATF'
  if (c === '/propriedades') return 'Propriedades'
  if (c === '/dg') return 'Fazendas'
  if (c === '/touros') return 'Touros'
  if (c === '/estoque') return 'Estoque'
  if (/^\/propriedades\/[^/]+\/painel$/.test(c)) return 'Painel'
  if (/^\/propriedades\/[^/]+$/.test(c)) return 'Fazenda'
  if (/^\/lotes\/[^/]+$/.test(c)) return 'Lote'
  if (/^\/animais\/[^/]+$/.test(c)) return 'Vaca'
  if (/^\/atendimentos\/[^/]+\/dg$/.test(c)) return 'DG'
  if (/^\/atendimentos\/[^/]+\/planilha$/.test(c)) return 'Planilha'
  if (/^\/atendimentos\/[^/]+$/.test(c)) return 'Atendimento'
  return 'Voltar'
}
