<script setup lang="ts">
const route = useRoute()
const { atendimentos, carregando } = useAtendimentos()
const filtro = ref<'andamento' | 'finalizados'>('andamento')
const propriedadeId = computed(() => (route.query.propriedade ? String(route.query.propriedade) : null))

const lista = computed(() => atendimentos.value.filter(a =>
  (filtro.value === 'andamento' ? a.status !== 'finalizado' : a.status === 'finalizado')
  && (!propriedadeId.value || a.propriedadeId === propriedadeId.value),
))
const link = (a: { id: string, status: string }) => (a.status === 'dg' ? `/atendimentos/${a.id}/dg` : `/atendimentos/${a.id}`)
</script>

<template>
  <AppTela titulo="IATF" sobrelinha="Atendimentos" :voltar="{ to: '/', rotulo: 'Início' }" larga>
    <template #topo>
      <GrupoEscolha
        v-model="filtro" rotulo="Filtrar atendimentos"
        :opcoes="[{ valor: 'andamento', rotulo: 'Em andamento' }, { valor: 'finalizados', rotulo: 'Finalizados' }]"
      />
    </template>
    <div class="grade-cartoes">
      <ItemLista
        v-for="a in lista" :key="a.id" :to="link(a)"
        :titulo="`${a.propriedade} · ${a.lote}`"
        :subtitulo="`D0 ${formatarData(a.dataD0)} · ${a.tipo === 'so_dg' ? 'Só DG' : 'DG + IATF'}`"
      >
        <span class="selo" :class="a.status === 'finalizado' ? 'tom-neutro' : 'tom-ambar'">{{ rotuloStatus[a.status] }}</span>
        <span v-if="a.resultado?.taxaPrenhez != null" class="selo tom-verde">Prenhez {{ formatarTaxa(a.resultado.taxaPrenhez) }}</span>
      </ItemLista>
    </div>
    <div v-if="!carregando && !lista.length" class="vazio">
      Nenhum atendimento {{ filtro === 'andamento' ? 'em andamento' : 'finalizado' }}.
      <NuxtLink to="/dg" class="btn btn-contorno">Novo atendimento</NuxtLink>
    </div>
  </AppTela>
</template>
