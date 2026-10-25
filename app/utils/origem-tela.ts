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

/** `filha` é uma tela dentro de `mae` (ex.: a planilha dentro do atendimento) */
export const ehTelaFilha = (filha: string, mae: string) => sem(filha).startsWith(`${sem(mae).replace(/\/$/, '')}/`)

/**
 * Qual tela está em cada posição do histórico da aba. Serve para voltar vários passos de uma vez
 * até uma tela que já está no histórico, em vez de abri-la de novo por cima (o que deixa telas
 * antigas no caminho do Voltar e faz ele ir e vir entre duas telas).
 */
const chavePosicao = (posicao: number) => `posicao:${posicao}`
const posicaoAtual = () => (window.history.state as { position?: unknown } | null)?.position

export function guardarPosicao(caminho: string) {
  const posicao = posicaoAtual()
  if (typeof posicao !== 'number') return
  try {
    sessionStorage.setItem(chavePosicao(posicao), caminho)
    // O que estava à frente desta posição saiu do histórico
    for (let p = posicao + 1; sessionStorage.getItem(chavePosicao(p)) !== null; p++) sessionStorage.removeItem(chavePosicao(p))
  }
  catch { /* sem armazenamento */ }
}

/** Quantos passos para trás está `destino` no histórico (0 se não está) */
function passosAte(destino: string) {
  const posicao = posicaoAtual()
  if (typeof posicao !== 'number') return 0
  try {
    for (let p = posicao - 1; p >= 0; p--) {
      const caminho = sessionStorage.getItem(chavePosicao(p))
      if (caminho !== null && sem(caminho) === sem(destino)) return posicao - p
    }
  }
  catch { /* sem armazenamento */ }
  return 0
}

/**
 * Leva a pessoa a `destino` voltando no histórico quando ele já está lá atrás; senão troca a tela
 * atual por ele. Usado pelo Voltar e por quem conclui uma tela de preencher (planilha, formulário,
 * relatório): abrir `destino` como tela nova deixaria "atendimento → planilha → atendimento", e o
 * Voltar ficaria indo e vindo entre as duas.
 */
export function irPara(destino: string) {
  const passos = passosAte(destino)
  if (passos) return useNuxtApp().$router.go(-passos)
  return navigateTo(destino, { replace: true })
}
export const concluirPara = irPara

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
