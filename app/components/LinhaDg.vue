<script setup lang="ts">
import type { Animal, AtendimentoAnimal, SituacaoDg } from '#shared/types/entidades'
import type { VacaNoAtendimento } from '~/composables/useAtendimento'

/** `aberta`: só a vaca em que se está mexendo mostra os campos; as outras mostram um resumo */
const props = defineProps<{ vaca: VacaNoAtendimento, aberta: boolean }>()
const emit = defineEmits<{
  linha: [campos: Partial<AtendimentoAnimal>]
  animal: [campos: Partial<Animal>]
  abrir: []
}>()

const situacao = computed<SituacaoDg>(() => props.vaca.linha?.situacaoDg ?? 'pendente')
const n = computed(() => props.vaca.animal.numero)
const id = useId()

function escolher(valor: SituacaoDg | null) {
  emit('linha', { situacaoDg: valor ?? 'pendente' })
  // Marcar esta vaca fecha os campos da que foi marcada antes
  emit('abrir')
}

const temDetalhes = computed(() => ['prenha', 'descarte', 'refugo'].includes(situacao.value))
/** Resumo da vaca fechada: o que já foi anotado, ou o que falta anotar */
const resumo = computed(() => {
  const l = props.vaca.linha
  const a = props.vaca.animal
  if (situacao.value === 'prenha') {
    const partes = [l?.idadeGestacional, a.previsaoParto && `parto ${formatarData(a.previsaoParto)}`, a.touroPrenhez].filter(Boolean)
    return partes.length ? partes.join(' · ') : 'Anotar idade gestacional'
  }
  if (situacao.value === 'descarte') return l?.destinoDescarte || 'Anotar destino do descarte'
  if (situacao.value === 'refugo') return l?.motivoRefugo || 'Anotar motivo do refugo'
  return ''
})
</script>

<template>
  <div class="linha" :class="{ avaliada: situacao !== 'pendente' }">
    <div class="topo">
      <NuxtLink :to="`/animais/${vaca.animal.id}`" class="numero" :aria-label="`Vaca ${n}, abrir cadastro`">{{ n }}</NuxtLink>
      <GrupoEscolha :model-value="situacao" :opcoes="situacoesDg" :rotulo="`Situação da vaca ${n}`" desmarcavel compacto @update:model-value="escolher" />
    </div>

    <button v-if="temDetalhes && !aberta" type="button" class="resumo" :class="{ falta: resumo.startsWith('Anotar') }" @click="emit('abrir')">
      {{ resumo }}
      <Icone nome="avancar" :tamanho="16" />
    </button>

    <Transition name="abrir-detalhes">
    <div v-if="aberta && situacao === 'prenha'" class="detalhes">
      <div class="campo">
        <label :for="`${id}-ig`">Idade gestacional</label>
        <EntradaAoSair :id="`${id}-ig`" class="entrada-compacta" :valor="vaca.linha?.idadeGestacional ?? ''" placeholder="Ex.: 60 dias" @salvar="emit('linha', { idadeGestacional: $event })" />
      </div>
      <div class="linha-campos">
        <div class="campo">
          <label :for="`${id}-pv`">Previsão de parto</label>
          <EntradaAoSair :id="`${id}-pv`" type="date" class="entrada-compacta" :valor="vaca.animal.previsaoParto ?? ''" @salvar="emit('animal', { previsaoParto: $event || null })" />
          <span class="auto">Calculada pela idade gestacional</span>
        </div>
        <div class="campo">
          <label :for="`${id}-tr`">Touro da prenhez</label>
          <EntradaAoSair :id="`${id}-tr`" class="entrada-compacta" :valor="vaca.animal.touroPrenhez ?? ''" @salvar="emit('animal', { touroPrenhez: $event })" />
        </div>
      </div>
    </div>
    <div v-else-if="aberta && situacao === 'descarte'" class="detalhes">
      <div class="campo">
        <label :for="`${id}-ds`">Destino do descarte</label>
        <EntradaAoSair :id="`${id}-ds`" class="entrada-compacta" :valor="vaca.linha?.destinoDescarte ?? ''" @salvar="emit('linha', { destinoDescarte: $event })" />
      </div>
    </div>
    <div v-else-if="aberta && situacao === 'refugo'" class="detalhes">
      <div class="campo">
        <label :for="`${id}-mr`">Motivo do refugo</label>
        <EntradaAoSair :id="`${id}-mr`" class="entrada-compacta" :valor="vaca.linha?.motivoRefugo ?? ''" @salvar="emit('linha', { motivoRefugo: $event })" />
      </div>
    </div>
    </Transition>
  </div>
</template>

<style scoped>
.linha { padding: 6px 16px 8px; background: var(--superficie); border-bottom: 1px solid var(--borda-suave); display: flex; flex-direction: column; gap: 8px; }
.topo { display: flex; align-items: center; gap: 8px; min-height: 48px; flex-wrap: wrap; }
.numero { flex: 1; min-width: 56px; font-size: 16px; font-weight: 700; min-height: 44px; display: flex; align-items: center; }
.detalhes { display: flex; flex-direction: column; gap: 10px; padding: 0 0 6px; }
.detalhes label { font-size: 12px; }
.auto { font-size: 12px; color: var(--texto-suave); }
.resumo {
  align-self: flex-start; display: inline-flex; align-items: center; gap: 6px; min-height: 36px; margin-top: -4px; padding: 0 12px;
  border: 0; border-radius: 999px; background: var(--primaria-suave); color: var(--primaria); font-size: 13px; font-weight: 500;
  animation: surgir var(--medio) var(--curva);
}
.resumo.falta { background: var(--ambar-suave); color: var(--ambar-texto); }
.abrir-detalhes-enter-active { transition: opacity var(--medio) var(--curva), transform var(--medio) var(--curva); }
.abrir-detalhes-enter-from { opacity: 0; transform: translateY(-6px); }
</style>
