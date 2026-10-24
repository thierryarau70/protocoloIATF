<script setup lang="ts">
const { query } = useRoute()
const texto = (v: unknown) => (v ? String(v) : undefined)
</script>

<template>
  <FormAnimal :lote-id="texto(query.lote)" :atendimento-id="texto(query.atendimento)" :numero="texto(query.numero)" />
</template>
