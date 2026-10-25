<script setup lang="ts">
const { propriedades, carregando } = usePropriedades()
const busca = ref('')
const filtradas = computed(() => propriedades.value.filter(p => contem(p.nome, busca.value) || contem(p.proprietario, busca.value)))
</script>

<template>
  <AppTela titulo="Propriedades" :voltar="{ to: '/', rotulo: 'Início' }" larga>
    <div class="pilha">
      <CampoBusca v-model="busca" rotulo="Buscar propriedade" placeholder="Nome da fazenda ou proprietário" />
      <div class="suave">{{ plural(filtradas.length, 'propriedade cadastrada', 'propriedades cadastradas') }}</div>
      <div class="grade-cartoes">
        <ItemLista
          v-for="p in filtradas" :key="p.id" :to="`/propriedades/${p.id}`" :titulo="p.nome"
          :subtitulo="p.proprietario ? `Proprietário: ${p.proprietario}` : undefined"
        >
          <span class="selo tom-verde">{{ plural(p.totalLotes, 'lote') }}</span>
          <span class="selo tom-verde">{{ plural(p.totalAnimais, 'animal', 'animais') }}</span>
        </ItemLista>
      </div>
      <div v-if="!carregando && !propriedades.length" class="vazio">
        Nenhuma propriedade ainda. Cadastre a primeira para começar.
      </div>
    </div>
    <template #rodape>
      <NuxtLink to="/propriedades/nova" class="btn btn-primario btn-bloco">
        <Icone nome="mais" />
        Nova propriedade
      </NuxtLink>
    </template>
  </AppTela>
</template>
