<script setup lang="ts">
const { lotes, carregando } = useLotes()
const busca = ref('')
const filtrados = computed(() => lotes.value.filter(l => contem(l.nome, busca.value) || contem(l.propriedade, busca.value)))
</script>

<template>
  <AppTela titulo="Lotes" :voltar="{ to: '/', rotulo: 'Início' }" larga>
    <div class="pilha">
      <CampoBusca v-model="busca" rotulo="Buscar lote" placeholder="Lote ou fazenda" />
      <div class="suave">{{ plural(filtrados.length, 'lote') }}</div>
      <div class="grade-cartoes">
        <ItemLista v-for="l in filtrados" :key="l.id" :to="`/lotes/${l.id}`" :titulo="l.nome" :subtitulo="l.propriedade">
          <span class="selo tom-verde">{{ plural(l.totalAnimais, 'vaca') }}</span>
        </ItemLista>
      </div>
      <div v-if="!carregando && !lotes.length" class="vazio">
        Nenhum lote ainda. Crie um lote dentro de uma propriedade.
      </div>
    </div>
    <template #rodape>
      <NuxtLink to="/lotes/novo" class="btn btn-primario btn-bloco">
        <Icone nome="mais" />
        Novo lote
      </NuxtLink>
    </template>
  </AppTela>
</template>
