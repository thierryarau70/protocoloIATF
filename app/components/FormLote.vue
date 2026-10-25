<script setup lang="ts">
import { validarCampos } from '#shared/esquemas'

const props = defineProps<{ id?: string, propriedadeId?: string }>()

const { lote } = useLote(() => props.id ?? '')
const { propriedades } = usePropriedades()
const form = reactive({ nome: '', localPrincipal: '', propriedadeId: props.propriedadeId ?? '' })
watch(() => lote.value?.id, () => {
  const l = lote.value
  if (l) Object.assign(form, { nome: l.nome, localPrincipal: l.localPrincipal ?? '', propriedadeId: l.propriedadeId })
}, { immediate: true })

const route = useRoute()
/** Problemas encontrados antes de salvar (mesmas regras do servidor) */
const erros = ref<string[]>([])
const checar = (dados: { id?: string }, extras: string[] = []) => {
  erros.value = [...extras, ...Object.values(validarCampos('lote', { ...dados, id: dados.id ?? novoId() }))]
  return !erros.value.length
}

async function salvar() {
  const dados = { id: props.id, ...form }
  if (!checar(dados)) return
  const salvo = await salvarLote(dados)
  // Vindo do fluxo do DG, volta para escolher o lote recém-criado
  const destino = route.query.voltar === 'dg' ? `/dg/${salvo.propriedadeId}` : `/lotes/${salvo.id}`
  await concluirPara(destino)
}
</script>

<template>
  <AppTela
    :titulo="id ? 'Editar lote' : 'Novo lote'"
    :voltar="id ? { to: `/lotes/${id}`, rotulo: 'Lote' } : { to: propriedadeId ? `/propriedades/${propriedadeId}` : '/lotes', rotulo: 'Voltar' }"
  >
    <form id="form-lote" class="pilha" novalidate @submit.prevent="salvar">
      <div v-if="!propriedadeId && !id" class="campo">
        <label for="propriedade">Propriedade</label>
        <select id="propriedade" v-model="form.propriedadeId" class="entrada" required>
          <option value="" disabled>Escolha a propriedade</option>
          <option v-for="p in propriedades" :key="p.id" :value="p.id">{{ p.nome }}</option>
        </select>
      </div>
      <div class="campo">
        <label for="nome">Nome do lote</label>
        <input id="nome" v-model="form.nome" class="entrada" placeholder="Ex.: Lote 1" required>
      </div>
      <div class="campo">
        <label for="local">Local principal</label>
        <input id="local" v-model="form.localPrincipal" class="entrada" placeholder="Pasto, retiro, curral">
        <span class="dica">Visível só para o proprietário.</span>
      </div>
      <ul v-if="erros.length" class="erro lista-erros" role="alert">
        <li v-for="e in erros" :key="e">{{ e }}</li>
      </ul>
    </form>
    <template #rodape>
      <button type="submit" form="form-lote" class="btn btn-primario btn-bloco">Salvar lote</button>
    </template>
  </AppTela>
</template>
