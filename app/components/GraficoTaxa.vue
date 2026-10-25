<script setup lang="ts">
/**
 * Taxas (0–100%) comparadas entre poucos grupos. Pensado para o celular:
 * nome e valor numa linha, barra de largura total embaixo, detalhe em texto.
 * Nada depende de passar o dedo ou o mouse: todo número fica escrito.
 */
defineProps<{
  titulo: string
  descricao?: string
  itens: { rotulo: string, taxa: number | null, detalhe: string }[]
}>()
</script>

<template>
  <figure class="grafico">
    <figcaption class="cabecalho">
      <span class="titulo-secao">{{ titulo }}</span>
      <span v-if="descricao" class="dica">{{ descricao }}</span>
    </figcaption>
    <ul class="itens">
      <li v-for="(i, n) in itens" :key="i.rotulo" class="item">
        <div class="linha">
          <span class="nome">{{ i.rotulo }}</span>
          <span class="valor">{{ formatarTaxa(i.taxa) }}</span>
        </div>
        <div class="trilho" aria-hidden="true">
          <span class="barra" :style="{ width: `${i.taxa ?? 0}%`, animationDelay: `${n * 70}ms` }" />
        </div>
        <span class="suave">{{ i.detalhe }}</span>
      </li>
    </ul>
  </figure>
</template>

<style scoped>
.grafico { margin: 0; display: flex; flex-direction: column; gap: 14px; }
.cabecalho { display: flex; flex-direction: column; gap: 4px; }
.itens { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 16px; }
.item { display: flex; flex-direction: column; gap: 6px; }
.linha { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.nome { font-size: 15px; font-weight: 500; }
.valor { font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; }
/* O trilho mostra a escala inteira (0 a 100%), então barras de grupos diferentes se comparam direto */
.trilho { height: 12px; border-radius: 4px; background: var(--neutro-suave); overflow: hidden; }
.barra { display: block; height: 100%; border-radius: 4px; background: var(--primaria); transform-origin: left; animation: crescer 700ms var(--curva) backwards; transition: width var(--medio) var(--curva); }
</style>
