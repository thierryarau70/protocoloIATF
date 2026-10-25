const CHAVE_DISPENSADO = 'iatf:instalar-dispensado'

/**
 * Instalação do app na tela do celular. Chrome/Edge (Android e computador) abrem o pedido
 * nativo num toque; iPhone e outros navegadores precisam do passo a passo.
 */
export function useInstalacao() {
  const { $pwa } = useNuxtApp()
  const ua = navigator.userAgent
  // iPad recente se apresenta como Mac, mas tem toque
  const ios = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)
  const celular = ios || /Android/.test(ua)

  const instalado = computed(() => !!$pwa?.isPWAInstalled || (navigator as { standalone?: boolean }).standalone === true)
  const nativo = computed(() => !!$pwa?.showInstallPrompt)
  const modo = computed<'instalado' | 'nativo' | 'ios' | 'android' | 'computador'>(() => {
    if (instalado.value) return 'instalado'
    if (nativo.value) return 'nativo'
    if (ios) return 'ios'
    return celular ? 'android' : 'computador'
  })

  const dispensado = ref(lerDispensado())
  function dispensar() {
    dispensado.value = true
    try { localStorage.setItem(CHAVE_DISPENSADO, '1') }
    catch { /* sem armazenamento: some só nesta visita */ }
  }

  async function instalar() {
    const escolha = await $pwa?.install()
    return escolha?.outcome === 'accepted'
  }

  return { modo, dispensado, dispensar, instalar }
}

function lerDispensado() {
  try { return localStorage.getItem(CHAVE_DISPENSADO) === '1' }
  catch { return false }
}
