<script setup lang="ts" generic="V extends string | boolean">
import type { Tom } from '~/utils/rotulos'

const props = defineProps<{
  opcoes: { valor: V, rotulo: string, tom?: Tom }[]
  modelValue: V | null | undefined
  rotulo: string
  /** Toque de novo na opção escolhida desmarca */
  desmarcavel?: boolean
  compacto?: boolean
}>()
const emit = defineEmits<{ 'update:modelValue': [valor: V | null] }>()

function escolher(valor: V) {
  emit('update:modelValue', props.desmarcavel && props.modelValue === valor ? null : valor)
}
</script>

<template>
  <div class="grupo" role="group" :aria-label="rotulo">
    <button
      v-for="o in opcoes"
      :key="String(o.valor)"
      type="button"
      class="opcao"
      :class="[`tom-${o.tom ?? 'verde'}`, { compacto, ativa: modelValue === o.valor }]"
      :aria-pressed="modelValue === o.valor"
      @click="escolher(o.valor)"
    >
      {{ o.rotulo }}
    </button>
  </div>
</template>

<style scoped>
.grupo { display: flex; gap: 6px; flex-wrap: wrap; }
.opcao {
  min-height: 44px; padding: 0 14px; border-radius: 10px; border: 2px solid var(--borda); background: var(--superficie);
  color: var(--texto); font-size: 14px; font-weight: 500;
}
.compacto { padding: 0 9px; font-size: 13px; }
.opcao:not(.ativa) { background: var(--superficie); color: var(--texto); }
.ativa { font-weight: 700; }
.ativa.tom-verde { border-color: var(--primaria); }
.ativa.tom-ambar { border-color: var(--ambar-borda); }
.ativa.tom-vermelho { border-color: var(--vermelho-borda); }
.ativa.tom-neutro { border-color: var(--neutro-borda); }
</style>
