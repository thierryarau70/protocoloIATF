<script setup lang="ts">
const { online, pendentes, rejeitados, limparRejeitados } = useSincronizacao()

// Mostra "Tudo sincronizado" por alguns segundos depois que a fila esvazia
const concluiu = ref(false)
let temporizador: ReturnType<typeof setTimeout> | undefined
watch(pendentes, (agora, antes) => {
  if (antes > 0 && agora === 0 && online.value) {
    concluiu.value = true
    clearTimeout(temporizador)
    temporizador = setTimeout(() => { concluiu.value = false }, 4000)
  }
})
onBeforeUnmount(() => clearTimeout(temporizador))
</script>

<template>
  <div aria-live="polite">
    <div v-if="rejeitados.length" class="faixa faixa-erro">
      <Icone nome="alerta" :tamanho="18" />
      <div class="texto">
        <strong>{{ plural(rejeitados.length, 'registro recusado', 'registros recusados') }} pelo servidor:</strong>
        {{ [...new Set(rejeitados)].join(' ') }}
      </div>
      <button type="button" class="fechar" aria-label="Fechar aviso" @click="limparRejeitados">
        <Icone nome="fechar" :tamanho="18" />
      </button>
    </div>
    <div v-if="!online" class="faixa faixa-offline">
      <Icone nome="sem-rede" :tamanho="18" />
      <div class="texto">
        Sem internet, salvo no aparelho.
        <template v-if="pendentes">{{ plural(pendentes, 'registro', 'registros') }} para enviar quando a conexão voltar.</template>
      </div>
    </div>
    <div v-else-if="pendentes" class="faixa faixa-enviando">
      <Icone nome="nuvem" :tamanho="18" />
      <div class="texto">Enviando {{ plural(pendentes, 'registro', 'registros') }}…</div>
    </div>
    <div v-else-if="concluiu" class="faixa faixa-ok">
      <Icone nome="check" :tamanho="18" />
      <div class="texto">Tudo sincronizado</div>
    </div>
  </div>
</template>

<style scoped>
.faixa { display: flex; align-items: center; gap: 10px; padding: 10px var(--lateral); font-size: 13px; font-weight: 500; line-height: 1.3; }
.texto { flex: 1; }
.faixa-offline { background: var(--ambar-suave); color: var(--ambar-texto); }
.faixa-enviando { background: var(--neutro-suave); color: var(--texto-2); }
.faixa-ok { background: var(--primaria-suave); color: var(--primaria); }
.faixa-erro { background: var(--vermelho-suave); color: var(--vermelho); }
.fechar { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border: 0; background: none; color: inherit; margin: -10px -12px -10px 0; }
</style>
