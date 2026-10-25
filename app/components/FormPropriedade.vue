<script setup lang="ts">
const props = defineProps<{ id?: string }>()

const { propriedade } = usePropriedade(() => props.id ?? '')
const form = reactive({ nome: '', proprietario: '', local: '', inscricao: '', semenTipo: null as 'particular' | 'misto' | null })
watch(() => propriedade.value?.id, () => {
  const p = propriedade.value
  if (p) Object.assign(form, { nome: p.nome, proprietario: p.proprietario ?? '', local: p.local ?? '', inscricao: p.inscricao ?? '', semenTipo: p.semenTipo })
}, { immediate: true })

async function salvar() {
  const salva = await salvarPropriedade({ id: props.id, ...form })
  await concluirPara(`/propriedades/${salva.id}`)
}
</script>

<template>
  <AppTela
    :titulo="id ? 'Editar propriedade' : 'Nova propriedade'"
    :voltar="id ? { to: `/propriedades/${id}`, rotulo: 'Propriedade' } : { to: '/propriedades', rotulo: 'Propriedades' }"
  >
    <form id="form-propriedade" class="pilha" @submit.prevent="salvar">
      <div class="campo">
        <label for="nome">Nome da propriedade</label>
        <input id="nome" v-model="form.nome" class="entrada" required>
      </div>
      <div class="campo">
        <label for="proprietario">Proprietário</label>
        <input id="proprietario" v-model="form.proprietario" class="entrada" autocomplete="off">
      </div>
      <div class="campo">
        <label for="local">Local</label>
        <input id="local" v-model="form.local" class="entrada" placeholder="Município, estrada, referência">
      </div>
      <div class="campo">
        <label for="inscricao">Inscrição</label>
        <input id="inscricao" v-model="form.inscricao" class="entrada">
      </div>
      <div class="campo">
        <span class="rotulo">Tipo de sêmen</span>
        <GrupoEscolha
          v-model="form.semenTipo" rotulo="Tipo de sêmen" desmarcavel
          :opcoes="[{ valor: 'particular', rotulo: 'Particular' }, { valor: 'misto', rotulo: 'Misto' }]"
        />
      </div>
    </form>
    <template #rodape>
      <button type="submit" form="form-propriedade" class="btn btn-primario btn-bloco">Salvar propriedade</button>
    </template>
  </AppTela>
</template>
