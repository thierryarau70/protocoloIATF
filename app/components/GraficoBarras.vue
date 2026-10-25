<script setup lang="ts">
import type { Tom } from '~/utils/rotulos'

const props = defineProps<{ titulo: string, itens: { rotulo: string, valor: number, tom?: Tom }[] }>()
const maximo = computed(() => Math.max(1, ...props.itens.map(i => i.valor)))
</script>

<template>
  <figure class="grafico">
    <figcaption class="titulo-secao">{{ titulo }}</figcaption>
    <dl class="barras">
      <div v-for="i in itens" :key="i.rotulo" class="barra-linha">
        <dt>{{ i.rotulo }}</dt>
        <dd>
          <span class="barra" :class="`barra-${i.tom ?? 'verde'}`" :style="{ width: `${(i.valor / maximo) * 100}%` }" />
          <span class="numero">{{ i.valor }}</span>
        </dd>
      </div>
    </dl>
  </figure>
</template>

<style scoped>
.grafico { margin: 0; display: flex; flex-direction: column; gap: 12px; }
.barras { margin: 0; display: flex; flex-direction: column; gap: 10px; }
.barra-linha { display: grid; grid-template-columns: 110px 1fr; align-items: center; gap: 10px; font-size: 14px; }
dt { color: var(--texto-2); font-weight: 500; }
dd { margin: 0; display: flex; align-items: center; gap: 8px; }
.barra { height: 14px; min-width: 2px; border-radius: 4px; }
.barra-verde { background: var(--primaria); }
.barra-ambar { background: var(--ambar-borda); }
.barra-vermelho { background: var(--vermelho-borda); }
.barra-neutro { background: var(--neutro-borda); }
.numero { font-weight: 700; font-variant-numeric: tabular-nums; }
</style>
