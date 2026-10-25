/** Aviso do app para a faixa do topo (ex.: tela que não abre sem internet). Vazio = sem aviso. */
export const useAvisoApp = () => useState('aviso-app', () => '')

/**
 * O app já abre sem internet neste aparelho? Verdadeiro quando o service worker controla a página
 * (todo o app guardado). `prontoAgora` vira verdadeiro só quando isso acaba de acontecer.
 */
export function useProntoSemInternet() {
  const pronto = ref(!!navigator.serviceWorker?.controller)
  const prontoAgora = ref(false)
  navigator.serviceWorker?.addEventListener('controllerchange', () => {
    pronto.value = !!navigator.serviceWorker.controller
  })
  const { $pwa } = useNuxtApp()
  watch(() => $pwa?.offlineReady, (v) => {
    if (v) {
      pronto.value = true
      prontoAgora.value = true
    }
  }, { immediate: true })
  return { pronto, prontoAgora }
}
