<script setup lang="ts">
import type { Animal, AtendimentoAnimal, SituacaoDg } from '#shared/types/entidades'
import type { VacaNoAtendimento } from '~/composables/useAtendimento'

const props = defineProps<{ vaca: VacaNoAtendimento }>()
const emit = defineEmits<{
  linha: [campos: Partial<AtendimentoAnimal>]
  animal: [campos: Partial<Animal>]
}>()

const situacao = computed<SituacaoDg>(() => props.vaca.linha?.situacaoDg ?? 'pendente')
const n = computed(() => props.vaca.animal.numero)
const id = useId()

function escolher(valor: SituacaoDg | null) {
  emit('linha', { situacaoDg: valor ?? 'pendente' })
}
const texto = (e: Event) => (e.target as HTMLInputElement).value
</script>

<template>
  <div class="linha" :class="{ avaliada: situacao !== 'pendente' }">
    <div class="topo">
      <NuxtLink :to="`/animais/${vaca.animal.id}`" class="numero" :aria-label="`Vaca ${n}, abrir cadastro`">{{ n }}</NuxtLink>
      <GrupoEscolha :model-value="situacao" :opcoes="situacoesDg" :rotulo="`Situação da vaca ${n}`" desmarcavel compacto @update:model-value="escolher" />
    </div>

    <div v-if="situacao === 'prenha'" class="detalhes">
      <div class="campo">
        <label :for="`${id}-ig`">Idade gestacional</label>
        <input :id="`${id}-ig`" class="entrada entrada-compacta" :value="vaca.linha?.idadeGestacional ?? ''" placeholder="Ex.: 60 dias" @change="emit('linha', { idadeGestacional: texto($event) })">
      </div>
      <div class="linha-campos">
        <div class="campo">
          <label :for="`${id}-pv`">Previsão de parto</label>
          <input :id="`${id}-pv`" type="date" class="entrada entrada-compacta" :value="vaca.animal.previsaoParto ?? ''" @change="emit('animal', { previsaoParto: texto($event) || null })">
        </div>
        <div class="campo">
          <label :for="`${id}-tr`">Touro da prenhez</label>
          <input :id="`${id}-tr`" class="entrada entrada-compacta" :value="vaca.animal.touroPrenhez ?? ''" @change="emit('animal', { touroPrenhez: texto($event) })">
        </div>
      </div>
    </div>
    <div v-else-if="situacao === 'descarte'" class="detalhes">
      <div class="campo">
        <label :for="`${id}-ds`">Destino do descarte</label>
        <input :id="`${id}-ds`" class="entrada entrada-compacta" :value="vaca.linha?.destinoDescarte ?? ''" @change="emit('linha', { destinoDescarte: texto($event) })">
      </div>
    </div>
    <div v-else-if="situacao === 'refugo'" class="detalhes">
      <div class="campo">
        <label :for="`${id}-mr`">Motivo do refugo</label>
        <input :id="`${id}-mr`" class="entrada entrada-compacta" :value="vaca.linha?.motivoRefugo ?? ''" @change="emit('linha', { motivoRefugo: texto($event) })">
      </div>
    </div>
  </div>
</template>

<style scoped>
.linha { padding: 6px 16px 8px; background: var(--superficie); border-bottom: 1px solid var(--borda-suave); display: flex; flex-direction: column; gap: 8px; }
.topo { display: flex; align-items: center; gap: 8px; min-height: 48px; flex-wrap: wrap; }
.numero { flex: 1; min-width: 56px; font-size: 16px; font-weight: 700; min-height: 44px; display: flex; align-items: center; }
.detalhes { display: flex; flex-direction: column; gap: 10px; padding: 0 0 6px; }
.detalhes label { font-size: 12px; }
</style>
