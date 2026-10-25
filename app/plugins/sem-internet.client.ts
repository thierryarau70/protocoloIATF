import layouts from '#build/layouts'

/**
 * O app precisa abrir qualquer tela sem internet, no curral.
 *
 * 1. Pré-carrega o código de todas as telas logo que abre com internet: mesmo antes de o service
 *    worker terminar de guardar tudo (primeiro acesso, ou logo depois de uma atualização), trocar
 *    de tela sem sinal funciona.
 * 2. Substitui o recarregamento automático do Nuxt (emitRouteChunkError: 'manual'): ele recarregava
 *    a página quando uma tela não carregava ou quando saía versão nova, e sem internet isso caía na
 *    página de erro do navegador. Agora só recarrega se a conexão responder de verdade (no campo o
 *    celular costuma dizer "online" com sinal fraco); sem ela, fica na tela e avisa.
 */
export default defineNuxtPlugin((nuxtApp) => {
  const router = useRouter()
  const aviso = useAvisoApp()

  function precarregar() {
    if (!navigator.onLine) return
    for (const rota of router.getRoutes()) {
      const componente = rota.components?.default
      if (typeof componente === 'function') (componente as () => Promise<unknown>)().catch(() => {})
    }
    // Os layouts (moldura das telas, ex.: o relatório) também são carregados à parte
    for (const layout of Object.values(layouts) as { __asyncLoader?: () => Promise<unknown> }[]) {
      layout.__asyncLoader?.().catch(() => {})
    }
  }
  nuxtApp.hook('app:mounted', () => {
    // Depois da primeira tela, sem disputar a rede com ela
    setTimeout(precarregar, 2500)
  })
  window.addEventListener('online', precarregar)

  // A página nova não herda o histórico: anota de onde veio, para o "Voltar" continuar certo
  const recarregar = (caminho: string) => {
    guardarOrigem(caminho, router.currentRoute.value.fullPath)
    reloadNuxtApp({ path: caminho, persistState: true })
  }
  const semInternet = 'Esta tela ainda não foi baixada para usar sem internet. Abra o app com internet uma vez e tente de novo.'

  /** A conexão responde mesmo? navigator.onLine diz "online" com sinal fraco ou sem dados. */
  async function temConexao() {
    if (!navigator.onLine) return false
    try {
      await fetch('/api/auth/eu', { cache: 'no-store', signal: AbortSignal.timeout(4000) })
      return true
    }
    catch {
      return false
    }
  }

  const errosDeCodigo = new Set<unknown>()
  router.beforeEach(() => errosDeCodigo.clear())
  nuxtApp.hook('app:chunkError', ({ error }) => { errosDeCodigo.add(error) })
  router.onError(async (erro, para) => {
    if (!errosDeCodigo.has(erro)) return
    if (await temConexao()) recarregar(para.fullPath)
    else aviso.value = semInternet
  })

  // Versão nova publicada: atualiza na próxima troca de tela, mas só com internet
  nuxtApp.hook('app:manifest:update', () => {
    router.beforeResolve(async (para) => {
      if (await temConexao()) recarregar(para.fullPath)
    })
  })
})
