<script setup lang="ts">
import type { ItemAgenda, Quando } from '~/utils/agenda'
import type { Tom } from '~/utils/rotulos'

const { itens } = useAgenda()

const tom: Record<Quando, Tom> = { atrasado: 'vermelho', hoje: 'verde', amanha: 'ambar', semana: 'neutro' }
const diaSemana = new Intl.DateTimeFormat('pt-BR', { weekday: 'short', timeZone: 'UTC' })

function quandoTexto(i: ItemAgenda) {
  const data = formatarData(i.data).slice(0, 5)
  if (i.quando === 'hoje') return 'Hoje'
  if (i.quando === 'amanha') return 'Amanhã'
  if (i.quando === 'atrasado') return `Atrasado · ${data}`
  return `${diaSemana.format(new Date(`${i.data}T00:00:00Z`))} ${data}`
}
</script>

<template>
  <section v-if="itens.length" class="pilha-curta" aria-labelledby="agenda-titulo">
    <h2 id="agenda-titulo" class="titulo-secao">Agenda</h2>
    <ItemLista
      v-for="i in itens" :key="`${i.atendimentoId}-${i.etapa}`" :to="linkEtapa(i)"
      :titulo="nomeEtapa[i.etapa]" :subtitulo="[i.propriedade, i.lote].filter(Boolean).join(' · ')"
      :destaque="i.quando === 'hoje'"
    >
      <span class="selo" :class="`tom-${tom[i.quando]}`">{{ quandoTexto(i) }}</span>
    </ItemLista>
  </section>
</template>
