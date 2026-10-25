import { liveQuery, type Subscription } from 'dexie'
import type { WatchSource } from 'vue'

/**
 * Lê do banco do aparelho e atualiza sozinho quando os dados mudam
 * (registro novo, sincronização etc.). `fonte` é o que, mudando, refaz a consulta.
 */
export function useConsulta<F, T>(fonte: WatchSource<F>, consulta: (valor: F) => Promise<T>, inicial: T) {
  const dados = shallowRef<T>(inicial)
  const carregando = ref(true)
  let inscricao: Subscription | undefined

  watch(fonte, (valor) => {
    inscricao?.unsubscribe()
    carregando.value = true
    inscricao = liveQuery(() => consulta(valor)).subscribe({
      next: (v) => {
        dados.value = v
        carregando.value = false
      },
      error: () => { carregando.value = false },
    })
  }, { immediate: true })

  onScopeDispose(() => inscricao?.unsubscribe())
  return { dados, carregando }
}
