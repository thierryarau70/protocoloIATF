<script setup lang="ts">
import type { AtendimentoAnimal } from '#shared/types/entidades'
import type { VacaNoAtendimento } from '~/composables/useAtendimento'

const props = defineProps<{ vaca: VacaNoAtendimento }>()
const emit = defineEmits<{ linha: [campos: Partial<AtendimentoAnimal>] }>()

const linha = computed(() => props.vaca.linha!)
const n = computed(() => props.vaca.animal.numero)
const id = useId()

// "Não inseminada" só é gravada junto com a justificativa
const naoInseminadaSemJustificativa = ref(false)
const inseminada = computed(() => (naoInseminadaSemJustificativa.value ? false : linha.value.inseminada))

function escolherInseminacao(valor: boolean | null) {
  naoInseminadaSemJustificativa.value = valor === false && !linha.value.justificativaNaoInseminada
  if (!naoInseminadaSemJustificativa.value) emit('linha', { inseminada: valor })
}
function justificar(e: Event) {
  const justificativa = (e.target as HTMLInputElement).value.trim()
  if (!justificativa) return
  naoInseminadaSemJustificativa.value = false
  emit('linha', { inseminada: false, justificativaNaoInseminada: justificativa })
}
const dias = [{ valor: 'd7' as const, rotulo: 'D7' }, { valor: 'd8' as const, rotulo: 'D8' }, { valor: 'd9' as const, rotulo: 'D9' }]
const opcoesInseminacao = [{ valor: true, rotulo: 'Inseminada' }, { valor: false, rotulo: 'Não inseminada', tom: 'vermelho' as const }]
</script>

<template>
  <div class="cartao vaca">
    <div class="cabecalho">
      <span class="numero">Vaca {{ n }}</span>
      <span class="selo tom-ambar">Apta</span>
    </div>
    <div class="linha-dia">
      <span class="rotulo">Hormônio</span>
      <GrupoEscolha :model-value="linha.hormonioDia" :opcoes="dias" :rotulo="`Dia do hormônio da vaca ${n}`" desmarcavel @update:model-value="emit('linha', { hormonioDia: $event })" />
    </div>
    <div class="linha-dia">
      <span class="rotulo">D10</span>
      <GrupoEscolha :model-value="inseminada" :opcoes="opcoesInseminacao" :rotulo="`Inseminação da vaca ${n}`" desmarcavel @update:model-value="escolherInseminacao" />
    </div>
    <div v-if="inseminada === false" class="campo">
      <label :for="`${id}-j`">Justificativa (obrigatória)</label>
      <input :id="`${id}-j`" class="entrada entrada-compacta" :value="linha.justificativaNaoInseminada ?? ''" required placeholder="Por que não foi inseminada?" @change="justificar">
    </div>
    <div class="campo">
      <label :for="`${id}-o`">Obs.</label>
      <input :id="`${id}-o`" class="entrada entrada-compacta" :value="linha.obs ?? ''" @change="emit('linha', { obs: ($event.target as HTMLInputElement).value })">
    </div>
  </div>
</template>

<style scoped>
.vaca { display: flex; flex-direction: column; gap: 10px; padding: 14px 16px; }
.cabecalho { display: flex; align-items: center; justify-content: space-between; }
.numero { font-size: 17px; font-weight: 700; }
.linha-dia { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.campo label { font-size: 12px; }
</style>
