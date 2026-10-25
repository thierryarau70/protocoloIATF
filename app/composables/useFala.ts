interface Resultado { isFinal: boolean, 0: { transcript: string } }
interface Reconhecimento {
  lang: string
  continuous: boolean
  interimResults: boolean
  onresult: ((e: { resultIndex: number, results: ArrayLike<Resultado> }) => void) | null
  onerror: ((e: { error: string }) => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

/**
 * Ditado pelo microfone (reconhecimento de fala do navegador, em português).
 * Fica ouvindo até parar: o navegador encerra sozinho depois de um silêncio e a escuta recomeça.
 */
export function useFala(aoOuvir: (texto: string) => void) {
  const Classe = (window as unknown as { SpeechRecognition?: new () => Reconhecimento, webkitSpeechRecognition?: new () => Reconhecimento })
  const Construtor = Classe.SpeechRecognition ?? Classe.webkitSpeechRecognition
  const suportado = !!Construtor
  const ouvindo = ref(false)
  const erro = ref('')
  let rec: Reconhecimento | undefined

  function iniciar() {
    if (!Construtor) return
    erro.value = ''
    rec = new Construtor()
    rec.lang = 'pt-BR'
    rec.continuous = true
    rec.interimResults = false
    rec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i]!
        if (r.isFinal) aoOuvir(r[0].transcript)
      }
    }
    rec.onerror = (e) => {
      if (e.error === 'no-speech' || e.error === 'aborted') return
      ouvindo.value = false
      erro.value = e.error === 'not-allowed' || e.error === 'service-not-allowed'
        ? 'Permita o uso do microfone para o ditado.'
        : e.error === 'network'
          ? 'O ditado precisa de internet neste aparelho.'
          : 'O ditado parou. Toque no microfone de novo.'
    }
    rec.onend = () => {
      if (ouvindo.value) {
        try { rec?.start() }
        catch { ouvindo.value = false }
      }
    }
    ouvindo.value = true
    rec.start()
  }

  function parar() {
    ouvindo.value = false
    rec?.stop()
  }

  onScopeDispose(parar)
  return { suportado, ouvindo, erro, iniciar, parar, alternar: () => (ouvindo.value ? parar() : iniciar()) }
}
