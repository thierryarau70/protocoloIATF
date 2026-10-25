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
</script>

<template>
  <input v-model="rascunho" class="entrada" @focus="focado = true" @blur="focado = false" @change="emit('salvar', String(rascunho))">
</template>
