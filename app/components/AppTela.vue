<script setup lang="ts">
withDefaults(defineProps<{
  titulo: string
  sobrelinha?: string
  voltar?: { to: string, rotulo: string }
  larga?: boolean
}>(), { larga: false })
</script>

<template>
  <div class="tela" :class="{ larga }">
    <header class="tela-topo">
      <div class="tela-largura topo-conteudo">
        <NuxtLink v-if="voltar" :to="voltar.to" class="voltar">
          <Icone nome="voltar" />
          {{ voltar.rotulo }}
        </NuxtLink>
        <div class="titulos-linha">
          <div class="titulos">
            <div v-if="sobrelinha" class="sobrelinha">{{ sobrelinha }}</div>
            <h1 class="titulo-tela">{{ titulo }}</h1>
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
