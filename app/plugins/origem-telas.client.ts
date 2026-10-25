/**
 * Anota de qual tela cada tela foi aberta e qual tela está em cada posição do histórico (ver
 * utils/origem-tela.ts). A origem só quando a pessoa avança: ao voltar, o histórico já aponta para
 * a tela anterior e a anotação daquela tela continua valendo.
 */
export default defineNuxtPlugin(() => {
  const router = useRouter()
  router.afterEach((para, de, falha) => {
    if (falha) return
    guardarPosicao(para.fullPath)
    if (!de.matched.length) return
    const back = (window.history.state as { back?: unknown } | null)?.back
    if (back === de.fullPath) guardarOrigem(para.fullPath, de.fullPath)
  })
})
