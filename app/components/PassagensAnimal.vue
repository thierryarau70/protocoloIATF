<script setup lang="ts">
import type { PassagemPorAtendimento } from '~/composables/useAnimais'

defineProps<{ passagens: PassagemPorAtendimento[] }>()

function iatf(p: PassagemPorAtendimento) {
  if (!p.linha.emProtocolo) return null
  if (p.linha.resultadoD45) return `IATF · D45 ${rotuloSituacao[p.linha.resultadoD45].toLowerCase()}`
  if (p.linha.inseminada === true) return 'IATF · inseminada'
  if (p.linha.inseminada === false) return `IATF · não inseminada (${p.linha.justificativaNaoInseminada})`
  return 'IATF · em protocolo'
}
function detalhe(p: PassagemPorAtendimento) {
  const l = p.linha
  return l.idadeGestacional ?? l.destinoDescarte ?? l.motivoRefugo ?? null
}
const link = (p: PassagemPorAtendimento) => (p.atendimento.status === 'dg' ? `/atendimentos/${p.atendimento.id}/dg` : `/atendimentos/${p.atendimento.id}`)
</script>

<template>
  <section class="pilha-curta">
    <h2 class="titulo-secao">Atendimentos</h2>
    <NuxtLink v-for="p in passagens" :key="p.linha.id" :to="link(p)" class="passagem">
      <div class="topo">
        <strong>DG {{ formatarData(p.atendimento.dataD0) }}</strong>
        <span class="selo" :class="`tom-${tomSituacao[p.linha.situacaoDg]}`">{{ rotuloSituacao[p.linha.situacaoDg] }}</span>
      </div>
      <div v-if="detalhe(p)" class="suave">{{ detalhe(p) }}</div>
      <div v-if="iatf(p)" class="suave">{{ iatf(p) }}</div>
    </NuxtLink>
    <p v-if="!passagens.length" class="dica">Esta vaca ainda não passou por nenhum DG no app.</p>
  </section>
</template>

<style scoped>
.passagem { display: flex; flex-direction: column; gap: 4px; padding: 12px 16px; background: var(--superficie); border: 1px solid var(--borda); border-radius: var(--raio-grande); }
.passagem:hover { border-color: var(--primaria); }
.topo { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 15px; }
</style>
