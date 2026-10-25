<script setup lang="ts">
defineProps<{ rotulo: string, placeholder?: string, numerico?: boolean }>()
const busca = defineModel<string>({ default: '' })
const id = useId()
</script>

<template>
  <div class="campo">
    <label :for="id">{{ rotulo }}</label>
    <div class="envoltorio">
      <Icone nome="busca" class="lupa" />
      <input :id="id" v-model="busca" type="search" class="entrada" :placeholder="placeholder" :inputmode="numerico ? 'numeric' : 'search'" autocomplete="off">
    </div>
  </div>
</template>

<style scoped>
.envoltorio { position: relative; }
.lupa { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--texto-suave); pointer-events: none; transition: color var(--rapido), transform var(--medio) var(--curva); }
.envoltorio:focus-within .lupa { color: var(--primaria); transform: translateY(-50%) scale(1.12) rotate(-8deg); }
.entrada { padding-left: 42px; }
</style>
