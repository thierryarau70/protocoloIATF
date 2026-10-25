<script setup lang="ts">
const props = defineProps<{ id?: string, loteId?: string, atendimentoId?: string, numero?: string }>()

import type { FormHistorico } from './CamposHistorico.vue'

const { animal, lote, passagens } = useAnimal(() => props.id ?? '')
const loteAtual = computed(() => animal.value?.loteId ?? props.loteId ?? '')
const form = reactive({ numero: props.numero ?? '', nascimento: '', peso: '', raca: '', previsaoParto: '', touroPrenhez: '' })
const historico = ref<FormHistorico>({ numPrenhezes: '', numAbortos: '', numPerdasGestacionais: '', numPartos: '', diasVazia: '', motivoDescarte: null })
// No cadastro rápido durante o DG o histórico fica para depois
const mostrarHistorico = computed(() => !!props.id || !props.atendimentoId)
const erro = ref('')
watch(() => animal.value?.id, () => {
  const a = animal.value
  if (a) {
    Object.assign(form, {
      numero: a.numero, nascimento: a.nascimento ?? '', peso: a.peso?.toString() ?? '', raca: a.raca ?? '',
      previsaoParto: a.previsaoParto ?? '', touroPrenhez: a.touroPrenhez ?? '',
    })
    const texto = (n: number | null) => n?.toString() ?? ''
    historico.value = {
      numPrenhezes: texto(a.numPrenhezes), numAbortos: texto(a.numAbortos), numPerdasGestacionais: texto(a.numPerdasGestacionais),
      numPartos: texto(a.numPartos), diasVazia: texto(a.diasVazia), motivoDescarte: a.motivoDescarte,
    }
  }
}, { immediate: true })

const destino = computed(() => (props.atendimentoId ? `/atendimentos/${props.atendimentoId}/dg` : `/lotes/${loteAtual.value}`))

async function salvar() {
  erro.value = ''
  if (await numeroRepetido(loteAtual.value, form.numero, props.id)) {
    erro.value = `Já existe a vaca ${form.numero} neste lote.`
    return
  }
  const peso = form.peso ? Number(form.peso.replace(',', '.')) : null
  const h = historico.value
  await salvarAnimal({
    id: props.id,
    loteId: loteAtual.value,
    numero: form.numero,
    nascimento: form.nascimento || null,
    peso: Number.isFinite(peso) ? peso : null,
    raca: form.raca,
    previsaoParto: form.previsaoParto || null,
    touroPrenhez: form.touroPrenhez,
    numPrenhezes: inteiroOuNulo(h.numPrenhezes),
    numAbortos: inteiroOuNulo(h.numAbortos),
    numPerdasGestacionais: inteiroOuNulo(h.numPerdasGestacionais),
    numPartos: inteiroOuNulo(h.numPartos),
    diasVazia: inteiroOuNulo(h.diasVazia),
    motivoDescarte: h.motivoDescarte,
  })
  await concluirPara(destino.value)
}
</script>

<template>
  <AppTela
    :titulo="id ? `Vaca ${animal?.numero ?? ''}` : 'Nova vaca'"
    :sobrelinha="lote?.nome"
    :voltar="{ to: destino, rotulo: atendimentoId ? 'DG' : 'Lote' }"
  >
    <form id="form-animal" class="pilha" @submit.prevent="salvar">
      <div class="campo">
        <label for="numero">Número</label>
        <input id="numero" v-model="form.numero" class="entrada" inputmode="numeric" autocomplete="off" required>
      </div>
      <div class="linha-campos">
        <div class="campo">
          <label for="nascimento">Nascimento</label>
          <input id="nascimento" v-model="form.nascimento" class="entrada" type="date">
        </div>
        <div class="campo">
          <label for="peso">Peso (kg)</label>
          <input id="peso" v-model="form.peso" class="entrada" inputmode="decimal">
        </div>
      </div>
      <CampoEscolhaBusca v-model="form.raca" rotulo="Raça" :opcoes="racasBovinas" placeholder="Buscar raça" sem-resultado="Nenhuma raça encontrada" />
      <fieldset class="cartao-suave prenha">
        <legend class="sr-only">Se a vaca estiver prenha</legend>
        <div class="titulo-bloco" aria-hidden="true">Se a vaca estiver prenha</div>
        <div class="campo">
          <label for="parto">Previsão de parto</label>
          <input id="parto" v-model="form.previsaoParto" class="entrada" type="date">
        </div>
        <div class="campo">
          <label for="touro">Touro da prenhez</label>
          <input id="touro" v-model="form.touroPrenhez" class="entrada" autocomplete="off">
        </div>
      </fieldset>
      <CamposHistorico v-if="mostrarHistorico" v-model="historico" />
      <p v-if="erro" class="erro" role="alert">{{ erro }}</p>
    </form>
    <ResumoVaca v-if="id && passagens.length" :passagens="passagens" class="passagens" />
    <PassagensAnimal v-if="id" :passagens="passagens" class="passagens" />
    <template #rodape>
      <button type="submit" form="form-animal" class="btn btn-primario btn-bloco">Salvar vaca</button>
    </template>
  </AppTela>
</template>

<style scoped>
.prenha { margin: 0; display: flex; flex-direction: column; gap: 12px; }
.titulo-bloco { font-size: 14px; font-weight: 700; }
.prenha label { color: var(--texto-2); }
.passagens { margin-top: 24px; }
</style>
