<script setup lang="ts">
/**
 * Campo que salva ao sair (evento change). Enquanto está em foco, guarda o que está sendo
 * digitado: uma sincronização em segundo plano que atualiza o registro não apaga o texto.
 */
const props = defineProps<{ valor: string | number | null | undefined }>()
const emit = defineEmits<{ salvar: [valor: string] }>()

const rascunho = ref(String(props.valor ?? ''))
const focado = ref(false)
watch(() => props.valor, (v) => {
  if (!focado.value) rascunho.value = String(v ?? '')
})

// Pulso verde rápido no campo confirma que o valor foi salvo
const salvo = ref(false)
let temporizador: ReturnType<typeof setTimeout> | undefined
function salvar() {
  emit('salvar', String(rascunho.value))
  salvo.value = false
  requestAnimationFrame(() => { salvo.value = true })
  clearTimeout(temporizador)
  temporizador = setTimeout(() => { salvo.value = false }, 700)
}
onBeforeUnmount(() => clearTimeout(temporizador))
</script>

<template>
  <input v-model="rascunho" class="entrada" :class="{ salvo }" @focus="focado = true" @blur="focado = false" @change="salvar">
</template>

<style scoped>
.salvo:not(:focus) { border-color: var(--primaria); animation: salvo 650ms var(--curva); }
</style>
