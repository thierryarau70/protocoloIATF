<script setup lang="ts">
defineProps<{ titulo: string, erro?: string, enviando?: boolean, botao: string }>()
defineEmits<{ enviar: [] }>()
</script>

<template>
  <div class="acesso">
    <form class="cartao formulario" @submit.prevent="$emit('enviar')">
      <div class="marca">
        <img src="/icon.svg" alt="" width="48" height="48">
        <div>
          <div class="sobrelinha">Protocolo IATF</div>
          <h1 class="titulo-tela">{{ titulo }}</h1>
        </div>
      </div>
      <slot />
      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
      <button type="submit" class="btn btn-primario btn-bloco" :disabled="enviando">{{ botao }}</button>
      <slot name="rodape" />
    </form>
  </div>
</template>

<style scoped>
.acesso { min-height: 100dvh; display: flex; align-items: center; justify-content: center; padding: 24px 16px; }
.formulario { width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 16px; padding: 24px 20px; }
.marca { display: flex; align-items: center; gap: 14px; margin-bottom: 4px; }
</style>
