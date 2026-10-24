<script setup lang="ts">
const props = withDefaults(defineProps<{ nome: keyof typeof caminhos, tamanho?: number }>(), { tamanho: 20 })

const caminhos = {
  'voltar': 'M15 6l-6 6 6 6',
  'avancar': 'M9 6l6 6-6 6',
  'check': 'M5 12l5 5 9-10',
  'mais': 'M12 5v14M5 12h14',
  'busca': 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM20 20l-4-4',
  'sem-rede': 'M3 3l18 18M8.5 8.5A10 10 0 0 0 2 12M22 12a10 10 0 0 0-4.5-5.5M12 18h.01M5 12a10 10 0 0 1 2-1.5M16 11.5A6 6 0 0 1 19 13',
  'nuvem': 'M7 18a5 5 0 1 1 1-9.9A6 6 0 0 1 19.5 10 4 4 0 0 1 18 18H7z',
  'inicio': 'M4 11l8-7 8 7v9a1 1 0 0 1-1 1h-5v-6h-4v6H5a1 1 0 0 1-1-1v-9z',
  'fazenda': 'M3 21V9l9-5 9 5v12M3 21h18M8 21v-7h8v7M8 14l8 7M16 14l-8 7',
  'lote': 'M4 6h16M4 12h16M4 18h10',
  'dg': 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 3',
  'iatf': 'M8 3h8M10 3v6l-5 9a2 2 0 0 0 2 3h10a2 2 0 0 0 2-3l-5-9V3M7 14h10',
  'perfil': 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  'sair': 'M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3M10 17l5-5-5-5M15 12H3',
  'fechar': 'M6 6l12 12M18 6L6 18',
  'alerta': 'M12 9v4M12 17h.01M10.3 3.9L2 18a2 2 0 0 0 1.7 3h16.6a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z',
}

const d = computed(() => caminhos[props.nome])
</script>

<template>
  <svg :width="tamanho" :height="tamanho" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" class="icone"><path :d="d" /></svg>
</template>

<style scoped>
.icone { flex: none; }
</style>
