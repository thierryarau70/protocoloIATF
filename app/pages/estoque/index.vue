<script setup lang="ts">
const { dados, carregando } = useDadosGerais()

const insumos = computed(() => dados.value.insumos.map(i => ({ ...i, situacao: estoqueInsumo(i, dados.value.atendimentos, dados.value.linhas) })))

// Sêmen com estoque, por fazenda
const fazendas = computed(() => dados.value.propriedades
  .map(p => ({
    id: p.id,
    nome: p.nome,
    semens: dados.value.semens
      .filter(s => s.propriedadeId === p.id)
      .map(s => ({ ...s, situacao: estoqueSemen(s, dados.value.atendimentos, dados.value.linhas) }))
      .filter(s => s.situacao)
      .sort(porNome),
  }))
  .filter(f => f.semens.length))

// "1 unidade", "2 unidades", "2 mL"
const qtd = (n: number, unidade: string) => `${n.toLocaleString('pt-BR')} ${n === 1 && unidade.endsWith('s') ? unidade.slice(0, -1) : unidade}`
</script>

<template>
  <AppTela titulo="Estoque" sobrelinha="Hormônios, implantes e sêmen" :voltar="{ to: '/', rotulo: 'Início' }" larga>
    <div class="colunas">
      <section class="pilha-curta">
        <h2 class="titulo-secao">Hormônios e implantes</h2>
        <ItemLista
          v-for="i in insumos" :key="i.id" :to="`/estoque/${i.id}`" :titulo="i.nome"
          :subtitulo="i.usoPorVaca ? `${qtd(i.usoPorVaca, i.unidade)} por vaca · contado em ${formatarData(i.saldoEm)}` : `Sem baixa automática · contado em ${formatarData(i.saldoEm)}`"
        >
          <span class="selo" :class="i.situacao.baixo ? 'tom-ambar' : 'tom-verde'">
            {{ i.situacao.baixo ? 'Repor · ' : '' }}restam {{ qtd(i.situacao.restante, i.unidade) }}
          </span>
        </ItemLista>
        <p v-if="!insumos.length && !carregando" class="cartao-suave">
          Cadastre os hormônios e implantes que você leva para o campo. Cada vaca em protocolo desconta o gasto.
        </p>
        <NuxtLink to="/estoque/novo" class="btn btn-tracejado btn-bloco">
          <Icone nome="mais" />
          Novo item
        </NuxtLink>
      </section>

      <section class="pilha-curta">
        <h2 class="titulo-secao">Sêmen nas fazendas</h2>
        <div v-for="f in fazendas" :key="f.id" class="pilha-curta">
          <span class="rotulo">{{ f.nome }}</span>
          <ItemLista
            v-for="s in f.semens" :key="s.id" :to="`/propriedades/${f.id}/semen/${s.id}?voltar=/estoque`" :titulo="s.nome"
            :subtitulo="`${s.situacao!.usado} usadas desde ${formatarData(s.estoqueEm)}`"
          >
            <span class="selo" :class="s.situacao!.baixo ? 'tom-ambar' : 'tom-verde'">
              {{ s.situacao!.baixo ? 'Repor · ' : '' }}{{ plural(s.situacao!.restante, 'dose') }}
            </span>
          </ItemLista>
        </div>
        <p v-if="!fazendas.length && !carregando" class="cartao-suave">
          Para controlar as doses, informe o estoque no cadastro do sêmen de cada fazenda.
        </p>
      </section>
    </div>
  </AppTela>
</template>

<style scoped>
.colunas { display: flex; flex-direction: column; gap: 24px; }

@media (min-width: 1024px) {
  .colunas { display: grid; grid-template-columns: 1fr 1fr; align-items: start; }
}
</style>
