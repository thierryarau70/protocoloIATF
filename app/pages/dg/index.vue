<script setup lang="ts">
const { propriedades, carregando } = usePropriedades()
const busca = ref('')
const filtradas = computed(() => propriedades.value.filter(p => contem(p.nome, busca.value) || contem(p.proprietario, busca.value)))
</script>

<template>
  <AppTela titulo="Escolha a fazenda" sobrelinha="DG + cadastro" :voltar="{ to: '/', rotulo: 'Início' }">
    <template #topo>
      <EtapasFluxo :atual="1" />
    </template>
    <div class="pilha">
      <CampoBusca v-model="busca" rotulo="Buscar fazenda" placeholder="Nome da fazenda ou proprietário" />
      <div class="suave">{{ plural(filtradas.length, 'fazenda cadastrada', 'fazendas cadastradas') }}</div>
      <ItemLista
        v-for="p in filtradas" :key="p.id" :to="`/dg/${p.id}`" :titulo="p.nome"
        :subtitulo="p.proprietario ? `Proprietário: ${p.proprietario}` : undefined"
      >
        <span class="selo tom-verde">{{ plural(p.totalLotes, 'lote') }}</span>
        <span class="selo tom-verde">{{ plural(p.totalAnimais, 'animal', 'animais') }}</span>
      </ItemLista>
      <div v-if="!carregando && !propriedades.length" class="vazio">
        Nenhuma fazenda cadastrada.
        <NuxtLink to="/propriedades/nova" class="btn btn-contorno">Cadastrar fazenda</NuxtLink>
      </div>
    </div>
    <template #rodape>
      <p class="dica">Fazendas, lotes e animais são cadastrados fora deste fluxo. Aqui você só escolhe.</p>
    </template>
  </AppTela>
</template>
