<script setup lang="ts">
const route = useRoute()
const id = () => String(route.params.id)
const { atendimento, lote, propriedade, vacas, atualizar, atualizarVaca } = useAtendimento(id)

const inseminadas = computed(() => vacas.value.filter(v => v.linha?.inseminada === true))
const prenhas = computed(() => inseminadas.value.filter(v => v.linha?.resultadoD45 === 'prenha').length)
const vazias = computed(() => inseminadas.value.filter(v => v.linha?.resultadoD45 === 'vazia').length)
const opcoes = [{ valor: 'prenha' as const, rotulo: 'Prenha' }, { valor: 'vazia' as const, rotulo: 'Vazia', tom: 'ambar' as const }]

async function finalizar() {
  await atualizar({ status: 'finalizado' })
  await navigateTo(`/atendimentos/${id()}`)
}
</script>

<template>
  <div>
    <!-- Raiz sempre presente: com v-if na raiz a transição entre telas trava -->
    <AppTela
      v-if="atendimento"
      titulo="D45 · DG final"
      :sobrelinha="`${propriedade?.nome ?? ''} · ${lote?.nome ?? ''} · ${formatarData(atendimento.dataD45)}`"
      :voltar="{ to: `/atendimentos/${atendimento.id}`, rotulo: lote?.nome ?? 'Lote' }"
    >
      <div class="pilha">
        <div class="estatisticas">
          <Estatistica :valor="formatarTaxa(atendimento.resultado?.taxaPrenhez)" rotulo="Taxa de prenhez" tom="forte" />
          <Estatistica :valor="prenhas" rotulo="Prenhas" tom="verde" />
          <Estatistica :valor="vazias" rotulo="Vazias" tom="ambar" />
        </div>
        <p class="dica">Inseminadas no D10: confirme quem emprenhou. Animais perdidos: {{ atendimento.animaisPerdidos }}. A taxa é calculada pelo servidor ao sincronizar.</p>
        <div class="lista">
          <div v-for="v in inseminadas" :key="v.animal.id" class="vaca">
            <span class="numero">Vaca {{ v.animal.numero }}</span>
            <GrupoEscolha
              :model-value="v.linha!.resultadoD45" :opcoes="opcoes" :rotulo="`DG final da vaca ${v.animal.numero}`" desmarcavel
              @update:model-value="atualizarVaca(v, { resultadoD45: $event })"
            />
          </div>
        </div>
        <div v-if="!inseminadas.length" class="vazio">Nenhuma vaca inseminada neste protocolo.</div>
      </div>
      <template #rodape>
        <button type="button" class="btn btn-primario btn-bloco" @click="finalizar">Finalizar lote</button>
      </template>
    </AppTela>
  </div>
</template>

<style scoped>
.estatisticas { display: flex; gap: 6px; }
.lista { display: flex; flex-direction: column; background: var(--superficie); border: 1px solid var(--borda); border-radius: var(--raio-grande); overflow: hidden; }
.lista:empty { display: none; }
.vaca { display: flex; align-items: center; justify-content: space-between; gap: 10px; min-height: 60px; padding: 8px 16px; border-bottom: 1px solid var(--borda-suave); }
.vaca:last-child { border-bottom: 0; }
.numero { font-size: 16px; font-weight: 700; }
</style>
