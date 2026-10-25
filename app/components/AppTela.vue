<script setup lang="ts">
const props = withDefaults(defineProps<{
  titulo: string
  sobrelinha?: string
  voltar?: { to: string, rotulo: string }
  larga?: boolean
}>(), { larga: false })

/**
 * "Voltar" leva à tela de onde a pessoa veio, como o voltar do celular: um lote aberto pela lista
 * de Lotes volta para Lotes, e não para a fazenda. Vem do histórico do navegador ou, se o app
 * recarregou a página, da anotação de origem (utils/origem-tela.ts). O destino fixo (voltar.to)
 * vale quando a tela foi aberta direto por um link, ou quando a anterior foi aberta a partir desta.
 */
const router = useRouter()
const anterior = ref<string | null>(null)
onMounted(() => {
  // Rota atual do roteador: a da página (useRoute) ainda aponta para a tela anterior durante a transição
  const aqui = router.currentRoute.value.fullPath
  const back = (window.history.state as { back?: unknown } | null)?.back
  // Uma tela aberta a partir desta (ex.: a planilha, no atendimento; o DG, no lote) não é "de onde
  // veio": voltar para ela prenderia a pessoa indo e vindo entre as duas
  const valida = (url: unknown): url is string =>
    typeof url === 'string' && url !== aqui && !ehTelaFilha(url, aqui) && lerOrigem(url) !== aqui
  const origem = valida(back) ? back : lerOrigem(aqui)
  anterior.value = valida(origem) ? origem : null
})
const caminho = (url: string) => url.split(/[?#]/)[0]
const rotulo = computed(() => {
  if (!props.voltar) return ''
  if (!anterior.value || caminho(anterior.value) === caminho(props.voltar.to)) return props.voltar.rotulo
  return nomeDaTela(anterior.value)
})

function aoVoltar(e: MouseEvent) {
  // Ctrl/Cmd+clique abre em outra aba: deixa o link normal
  if (e.metaKey || e.ctrlKey || e.shiftKey) return
  e.preventDefault()
  const destino = anterior.value ?? props.voltar?.to
  if (destino) irPara(destino)
}
</script>

<template>
  <div class="tela" :class="{ larga }">
    <header class="tela-topo">
      <div class="tela-largura topo-conteudo">
        <a v-if="voltar" :href="anterior ?? voltar.to" class="voltar" @click="aoVoltar">
          <Icone nome="voltar" />
          {{ rotulo }}
        </a>
        <div class="titulos-linha">
          <div class="titulos">
            <div v-if="sobrelinha" class="sobrelinha">{{ sobrelinha }}</div>
            <h1 class="titulo-tela mascara"><span class="revela">{{ titulo }}</span></h1>
            <slot name="subtitulo" />
          </div>
          <slot name="acao" />
        </div>
        <slot name="topo" />
      </div>
    </header>
    <AvisoSincronizacao />
    <main class="tela-corpo">
      <div class="tela-largura">
        <slot />
      </div>
    </main>
    <footer v-if="$slots.rodape" class="tela-rodape">
      <div class="tela-largura">
        <slot name="rodape" />
      </div>
    </footer>
  </div>
</template>

<style scoped>
.tela { min-height: 100dvh; display: flex; flex-direction: column; }
.tela-largura { width: 100%; max-width: 760px; margin: 0 auto; padding: 0 var(--lateral); }
.larga .tela-largura { max-width: 1120px; }
.tela-topo { background: var(--superficie); border-bottom: 1px solid var(--borda); padding: calc(env(safe-area-inset-top) + 12px) 0 16px; }
.topo-conteudo { display: flex; flex-direction: column; gap: 8px; }
.titulos-linha { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; }
.titulos { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
/* O título sobe de dentro de uma máscara ao abrir a tela */
.mascara { overflow: hidden; padding-bottom: .08em; margin-bottom: -.08em; }
.revela { display: block; animation: revelar-texto 480ms var(--curva) 60ms backwards; }
.sobrelinha { animation: surgir var(--medio) var(--curva) backwards; }
.voltar { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; align-self: flex-start; font-size: 14px; font-weight: 500; color: var(--primaria); margin-left: -4px; padding-right: 8px; }
.tela-corpo { flex: 1; padding: 20px 0 28px; }
.tela-rodape {
  position: sticky; bottom: 0; z-index: 5; background: var(--superficie); border-top: 1px solid var(--borda);
  padding: 12px 0 calc(env(safe-area-inset-bottom) + 16px);
}

@media (min-width: 1024px) {
  .tela-topo { padding-top: 28px; }
  .tela-corpo { padding-top: 28px; }
  .tela-rodape { padding-bottom: 16px; }
}
</style>
