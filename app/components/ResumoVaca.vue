<script setup lang="ts">
import type { PassagemPorAtendimento } from '~/composables/useAnimais'

const props = defineProps<{ passagens: PassagemPorAtendimento[] }>()
const r = computed(() => resumoReprodutivo(props.passagens))
</script>

<template>
  <section class="pilha-curta" aria-labelledby="resumo-vaca">
    <h2 id="resumo-vaca" class="titulo-secao">Resumo reprodutivo</h2>
    <p v-if="r.falhasSeguidas >= 2" class="cartao alerta" role="status">
      <Icone nome="alerta" />
      <span>Não emprenhou nos últimos {{ r.falhasSeguidas }} protocolos. Vale avaliar ou descartar.</span>
    </p>
    <div class="numeros">
      <div class="cartao"><Estatistica :valor="r.dgs" :rotulo="r.dgs === 1 ? 'DG' : 'DGs'" tom="plano" /></div>
      <div class="cartao"><Estatistica :valor="r.protocolos" rotulo="IATF finalizados" tom="plano" /></div>
      <div class="cartao"><Estatistica :valor="r.prenhezesD45" rotulo="Prenhezes no D45" tom="plano" /></div>
      <div class="cartao"><Estatistica :valor="formatarTaxa(r.taxa)" rotulo="Taxa de prenhez" tom="plano" /></div>
    </div>
  </section>
</template>

<style scoped>
.numeros { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
.numeros .cartao { padding: 6px; }
.alerta { display: flex; align-items: center; gap: 10px; margin: 0; border-color: var(--vermelho-borda); background: var(--vermelho-suave); color: var(--vermelho); font-size: 14px; font-weight: 500; }

@media (min-width: 720px) {
  .numeros { grid-template-columns: repeat(4, 1fr); }
}
</style>
