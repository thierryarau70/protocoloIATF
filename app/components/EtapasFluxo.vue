<script setup lang="ts">
defineProps<{ atual: number }>()
const etapas = ['Fazenda', 'Lote', 'DG', 'Protocolo']
</script>

<template>
  <ol class="etapas" aria-label="Etapas do atendimento">
    <li v-for="(e, i) in etapas" :key="e" :class="{ feita: i < atual, atual: i + 1 === atual }" :aria-current="i + 1 === atual ? 'step' : undefined">
      <span class="trilha" />
      <span class="nome">{{ i + 1 }} {{ e }}</span>
    </li>
  </ol>
</template>

<style scoped>
.etapas { list-style: none; margin: 4px 0 0; padding: 0; display: flex; gap: 6px; }
li { flex: 1; display: flex; flex-direction: column; gap: 6px; }
.trilha { height: 4px; border-radius: 2px; background: #CBD6CD; }
.feita .trilha { background: var(--primaria); }
.nome { font-size: 11px; font-weight: 500; color: var(--texto-suave); }
.atual .nome { font-weight: 700; color: var(--texto); }
</style>
