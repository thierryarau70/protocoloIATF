<script setup lang="ts">
defineProps<{ to: string, titulo: string, subtitulo?: string, destaque?: boolean }>()
</script>

<template>
  <NuxtLink :to="to" class="item cascata" :class="{ destaque }">
    <div class="corpo">
      <div class="titulo">{{ titulo }}</div>
      <div v-if="subtitulo" class="suave">{{ subtitulo }}</div>
      <div v-if="$slots.default" class="extras"><slot /></div>
    </div>
    <Icone nome="avancar" class="seta" />
  </NuxtLink>
</template>

<style scoped>
.item { display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 16px; background: var(--superficie); border: 1px solid var(--borda); border-radius: var(--raio-grande); transition: border-color var(--rapido), box-shadow var(--rapido), transform var(--rapido) var(--curva); }
.item:hover { border-color: var(--primaria); box-shadow: 0 6px 18px rgb(27 42 34 / .08); }
.item:active { transform: scale(.985); }
.seta { transition: transform var(--rapido) var(--curva), color var(--rapido); }
.item:hover .seta { transform: translateX(3px); color: var(--primaria); }
.destaque { border: 2px solid var(--primaria); }
.corpo { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; }
.titulo { font-size: 17px; font-weight: 700; }
.extras { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.seta { color: var(--texto-suave); }
</style>
