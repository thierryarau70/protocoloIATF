<script setup lang="ts">
import type { Tom } from '~/utils/rotulos'

withDefaults(defineProps<{ valor: string | number, rotulo: string, tom?: Tom | 'forte' | 'plano' }>(), { tom: 'neutro' })
</script>

<template>
  <div class="estatistica" :class="`tom-${tom}`">
    <div class="valor">{{ valor }}</div>
    <div class="legenda">{{ rotulo }}</div>
  </div>
</template>

<style scoped>
.estatistica { flex: 1; min-width: 0; padding: 10px 12px; border-radius: 10px; }
.valor { font-size: 22px; font-weight: 700; line-height: 1.1; }
.legenda { font-size: 12px; font-weight: 500; }
.tom-neutro { color: var(--texto-2); }
.tom-forte { background: var(--primaria); color: #FFFFFF; }
.tom-plano { color: var(--texto); }
</style>
