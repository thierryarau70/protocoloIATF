/**
 * Anota de qual tela cada tela foi aberta (ver utils/origem-tela.ts). Só quando a pessoa avança:
 * ao voltar, o histórico já aponta para a tela anterior e a anotação daquela tela continua valendo.
 */
export default defineNuxtPlugin(() => {
  const router = useRouter()
  router.afterEach((para, de, falha) => {
    if (falha || !de.matched.length) return
    const back = (window.history.state as { back?: unknown } | null)?.back
    if (back === de.fullPath) guardarOrigem(para.fullPath, de.fullPath)
  })
})
