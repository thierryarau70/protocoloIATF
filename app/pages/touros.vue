<script setup lang="ts">
const { dados, carregando } = useDadosGerais()

const fazenda = ref('')
const periodo = ref<'12' | '24' | 'tudo'>('tudo')
const minimo = ref(5)
const periodos = [{ valor: '12' as const, rotulo: '12 meses' }, { valor: '24' as const, rotulo: '24 meses' }, { valor: 'tudo' as const, rotulo: 'Tudo' }]
const minimos = [{ valor: '1', rotulo: 'Todos' }, { valor: '5', rotulo: '5+' }, { valor: '10', rotulo: '10+' }, { valor: '20', rotulo: '20+' }]

function mesesAtras(n: number) {
  const d = new Date()
  d.setMonth(d.getMonth() - n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

const touros = computed(() => rankingTouros(dados.value.semens, dados.value.lotes, dados.value.atendimentos, dados.value.linhas, {
  propriedadeId: fazenda.value || undefined,
  desde: periodo.value === 'tudo' ? undefined : mesesAtras(Number(periodo.value)),
  minimo: minimo.value,
}))
const itens = computed(() => touros.value.map((t, i) => ({
  rotulo: `${i + 1}º ${t.nome}`,
  taxa: t.taxa,
  detalhe: `${t.prenhas} de ${t.inseminadas} inseminadas emprenharam${t.fazendas > 1 ? ` · ${t.fazendas} fazendas` : ''}`,
})))
</script>

<template>
  <AppTela titulo="Ranking de touros" sobrelinha="Resultados" :voltar="{ to: '/', rotulo: 'Início' }" larga>
    <div class="colunas">
      <section class="pilha filtros" aria-label="Filtros">
        <div class="campo">
          <label for="fazenda">Fazenda</label>
          <select id="fazenda" v-model="fazenda" class="entrada">
            <option value="">Todas as fazendas</option>
            <option v-for="p in dados.propriedades" :key="p.id" :value="p.id">{{ p.nome }}</option>
          </select>
        </div>
        <div class="campo">
          <span class="rotulo">Período</span>
          <GrupoEscolha v-model="periodo" :opcoes="periodos" rotulo="Período" />
        </div>
        <div class="campo">
          <span class="rotulo">Mínimo de inseminações</span>
          <GrupoEscolha :model-value="String(minimo)" :opcoes="minimos" rotulo="Mínimo de inseminações" @update:model-value="minimo = Number($event ?? 1)" />
        </div>
        <p class="dica">
          Conta as inseminações com resultado no DG final (D45). O mesmo touro cadastrado em fazendas diferentes é somado pelo nome.
          Poucas inseminações dão uma taxa pouco confiável: use o mínimo para filtrar.
        </p>
      </section>

      <section class="cartao">
        <GraficoTaxa v-if="itens.length" titulo="Prenhez por touro" :itens="itens" />
        <p v-else-if="!carregando" class="dica">
          Nenhum touro com esses filtros. O ranking aparece depois dos DG finais (D45) com o sêmen anotado na planilha IATF.
        </p>
      </section>
    </div>
  </AppTela>
</template>

<style scoped>
.colunas { display: flex; flex-direction: column; gap: 24px; }

@media (min-width: 1024px) {
  .colunas { display: grid; grid-template-columns: 320px 1fr; align-items: start; }
}
</style>
