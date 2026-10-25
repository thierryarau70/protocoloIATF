<script setup lang="ts">
export interface FormHistorico {
  numPrenhezes: string
  numAbortos: string
  numPerdasGestacionais: string
  numPartos: string
  diasVazia: string
  motivoDescarte: 'saude_uterina' | 'cisto' | 'defeito_congenito' | null
}

const historico = defineModel<FormHistorico>({ required: true })
defineProps<{ erros?: Record<string, string> }>()
const id = useId()

const contagens = [
  { chave: 'numPrenhezes', rotulo: 'Nº de prenhezes' },
  { chave: 'numPartos', rotulo: 'Nº de partos' },
  { chave: 'numAbortos', rotulo: 'Abortos' },
  { chave: 'numPerdasGestacionais', rotulo: 'Perdas gestacionais' },
  { chave: 'diasVazia', rotulo: 'Dias vazia' },
] as const
</script>

<template>
  <fieldset class="historico">
    <legend class="titulo-secao">Histórico</legend>
    <div class="grade">
      <div v-for="c in contagens" :key="c.chave" class="campo">
        <label :for="`${id}-${c.chave}`">{{ c.rotulo }}</label>
        <input :id="`${id}-${c.chave}`" v-model="historico[c.chave]" class="entrada" type="number" min="0" step="1" inputmode="numeric" :aria-invalid="!!erros?.[c.chave]">
        <p v-if="erros?.[c.chave]" class="erro">{{ erros[c.chave] }}</p>
      </div>
    </div>
    <div class="campo">
      <span class="rotulo">Motivo de descarte</span>
      <GrupoEscolha v-model="historico.motivoDescarte" rotulo="Motivo de descarte" :opcoes="motivosDescarte" desmarcavel />
    </div>
  </fieldset>
</template>

<style scoped>
.historico { margin: 0; padding: 0; border: 0; display: flex; flex-direction: column; gap: 14px; }
.historico legend { padding: 0; margin-bottom: 14px; }
.grade { display: grid; grid-template-columns: 1fr 1fr; gap: 14px 10px; }
</style>
