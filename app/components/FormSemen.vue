<script setup lang="ts">
const props = defineProps<{ propriedadeId: string, id?: string }>()

const route = useRoute()
const semen = useSemen(() => props.id ?? '')
const { propriedade } = usePropriedade(() => props.propriedadeId)
const form = reactive({ nome: '', raca: '', partida: '' })
watch(() => semen.value?.id, () => {
  const s = semen.value
  if (s) Object.assign(form, { nome: s.nome, raca: s.raca ?? '', partida: s.partida ?? '' })
}, { immediate: true })

// Vindo da planilha, volta para ela depois de salvar (só caminhos internos)
const voltar = computed(() => {
  const v = String(route.query.voltar ?? '')
  return v.startsWith('/') && !v.startsWith('//') ? v : `/propriedades/${props.propriedadeId}`
})

async function salvar() {
  await salvarSemen({ id: props.id, propriedadeId: props.propriedadeId, ...form })
  await navigateTo(voltar.value, { replace: true })
}
</script>

<template>
  <AppTela :titulo="id ? 'Editar sêmen' : 'Novo sêmen'" :sobrelinha="propriedade?.nome" :voltar="{ to: voltar, rotulo: 'Voltar' }">
    <form id="form-semen" class="pilha" @submit.prevent="salvar">
      <div class="campo">
        <label for="nome">Touro</label>
        <input id="nome" v-model="form.nome" class="entrada" placeholder="Nome do touro" autocapitalize="words" autocomplete="off" required>
      </div>
      <CampoEscolhaBusca v-model="form.raca" rotulo="Raça" :opcoes="racasBovinas" placeholder="Buscar raça" sem-resultado="Nenhuma raça encontrada" />
      <div class="campo">
        <label for="partida">Central / partida</label>
        <input id="partida" v-model="form.partida" class="entrada" placeholder="Ex.: ABS 123" autocomplete="off">
      </div>
      <p class="dica">Os sêmens cadastrados aqui aparecem na planilha IATF desta fazenda para escolher em cada vaca inseminada.</p>
    </form>
    <template #rodape>
      <button type="submit" form="form-semen" class="btn btn-primario btn-bloco">Salvar sêmen</button>
    </template>
  </AppTela>
</template>
