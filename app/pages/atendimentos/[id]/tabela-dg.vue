<script setup lang="ts">
const route = useRoute()
const id = () => String(route.params.id)
const { atendimento, lote, propriedade, vacas, contagem, atualizar, atualizarVaca } = useAtendimento(id)

const avaliadas = computed(() => vacas.value.filter(v => v.linha && v.linha.situacaoDg !== 'pendente'))
const sobrelinha = computed(() => [propriedade.value?.nome, lote.value?.nome, formatarData(atendimento.value?.dataD0)].filter(Boolean).join(' · '))

async function finalizar() {
  await atualizar({ status: 'finalizado' })
  await concluirPara(`/atendimentos/${id()}`)
}
</script>

<template>
  <div>
    <!-- Raiz sempre presente: com v-if na raiz a transição entre telas trava -->
    <AppTela v-if="atendimento" titulo="Tabela do DG" :sobrelinha="sobrelinha" :voltar="{ to: `/atendimentos/${atendimento.id}/dg`, rotulo: 'DG' }" larga>
      <div class="pilha">
        <div class="estatisticas">
          <Estatistica :valor="contagem.prenha" rotulo="Prenhas" tom="verde" />
          <Estatistica :valor="contagem.vazia" rotulo="Vazias" tom="ambar" />
          <Estatistica :valor="contagem.descarte" rotulo="Descarte" tom="vermelho" />
          <Estatistica :valor="contagem.refugo" rotulo="Refugo" />
        </div>
        <p class="dica">Fazenda sem inseminação: o atendimento termina aqui, sem protocolo.</p>

        <div class="tabela-rolagem">
          <table class="tabela">
            <thead>
              <tr><th scope="col">Vaca</th><th scope="col">Situação</th><th scope="col">Detalhe</th></tr>
            </thead>
            <tbody>
              <tr v-for="v in avaliadas" :key="v.animal.id">
                <td class="numero">{{ v.animal.numero }}</td>
                <td><span class="selo" :class="`tom-${tomSituacao[v.linha!.situacaoDg]}`">{{ rotuloSituacao[v.linha!.situacaoDg] }}</span></td>
                <td class="detalhe">
                  <EntradaAoSair
                    v-if="v.linha!.situacaoDg === 'prenha'" class="entrada-compacta" placeholder="Idade gestacional"
                    :aria-label="`Idade gestacional da vaca ${v.animal.numero}`" :valor="v.linha!.idadeGestacional ?? ''"
                    @salvar="atualizarVaca(v, { idadeGestacional: $event })" />
                  <EntradaAoSair
                    v-else-if="v.linha!.situacaoDg === 'descarte'" class="entrada-compacta" placeholder="Destino"
                    :aria-label="`Destino do descarte da vaca ${v.animal.numero}`" :valor="v.linha!.destinoDescarte ?? ''"
                    @salvar="atualizarVaca(v, { destinoDescarte: $event })" />
                  <EntradaAoSair
                    v-else-if="v.linha!.situacaoDg === 'refugo'" class="entrada-compacta" placeholder="Motivo"
                    :aria-label="`Motivo do refugo da vaca ${v.animal.numero}`" :valor="v.linha!.motivoRefugo ?? ''"
                    @salvar="atualizarVaca(v, { motivoRefugo: $event })" />
                  <span v-else class="suave">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <div class="suave">{{ avaliadas.length }} de {{ plural(vacas.length, 'vaca avaliada', 'vacas avaliadas') }}</div>
      </div>
      <template #rodape>
        <button type="button" class="btn btn-primario btn-bloco" @click="finalizar">Finalizar DG</button>
      </template>
    </AppTela>
  </div>
</template>

<style scoped>
.estatisticas { display: flex; gap: 6px; }
.detalhe { min-width: 160px; }
</style>
