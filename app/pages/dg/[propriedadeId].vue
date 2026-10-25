<script setup lang="ts">
const route = useRoute()
const propriedadeId = () => String(route.params.propriedadeId)
const { propriedade, lotes, carregando } = usePropriedade(propriedadeId)
const dataAtendimento = ref(hoje())
const totalAnimais = computed(() => lotes.value.reduce((s, l) => s + l.totalAnimais, 0))

async function escolher(loteId: string) {
  const at = await iniciarAtendimento(loteId, dataAtendimento.value || hoje())
  await navigateTo(`/atendimentos/${at.id}/dg`)
}
</script>

<template>
  <AppTela v-if="propriedade" titulo="Escolha o lote" :sobrelinha="propriedade.nome" :voltar="{ to: '/dg', rotulo: 'Fazendas' }">
    <template #topo>
      <EtapasFluxo :atual="2" />
    </template>
    <div class="pilha">
      <div v-if="propriedade.proprietario" class="cartao-suave proprietario">
        <span>Proprietário</span>
        <strong>{{ propriedade.proprietario }}</strong>
      </div>
      <div class="suave">{{ plural(lotes.length, 'lote') }} · {{ plural(totalAnimais, 'animal', 'animais') }} (só vacas)</div>
      <button v-for="l in lotes" :key="l.id" type="button" class="lote" @click="escolher(l.id)">
        <span class="corpo">
          <span class="titulo">{{ l.nome }}</span>
          <span class="suave">{{ plural(l.totalAnimais, 'vaca') }}</span>
        </span>
        <Icone nome="avancar" />
      </button>
      <div v-if="!carregando && !lotes.length" class="vazio">Esta fazenda ainda não tem lote.</div>
      <NuxtLink :to="`/lotes/novo?propriedade=${propriedade.id}&voltar=dg`" class="btn btn-tracejado btn-bloco">
        + Novo lote
      </NuxtLink>
    </div>
    <template #rodape>
      <div class="data">
        <label for="data">Data do atendimento</label>
        <input id="data" v-model="dataAtendimento" type="date" class="entrada entrada-compacta">
      </div>
    </template>
  </AppTela>
</template>

<style scoped>
.proprietario { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 500; }
.proprietario strong { font-size: 15px; }
.lote { display: flex; align-items: center; gap: 12px; min-height: 64px; padding: 16px; background: var(--superficie); border: 1px solid var(--borda); border-radius: var(--raio-grande); text-align: left; color: var(--texto-suave); }
.lote:hover { border-color: var(--primaria); }
.corpo { flex: 1; display: flex; flex-direction: column; gap: 4px; }
.titulo { font-size: 17px; font-weight: 700; color: var(--texto); }
.data { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
.data label { font-size: 13px; color: var(--texto-suave); }
.data .entrada { width: auto; font-weight: 700; }
</style>
