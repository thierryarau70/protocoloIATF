<script setup lang="ts">
const route = useRoute()
const id = () => String(route.params.id)
const { atendimento, lote, propriedade, vacas, contagem, atualizar, atualizarVaca } = useAtendimento(id)

// Quem está no protocolo é decidido pelo servidor (emProtocolo)
const emProtocolo = computed(() => vacas.value.filter(v => v.linha?.emProtocolo))
const aguardandoServidor = computed(() => contagem.value.vazia > 0 && vacas.value.some(v => v.linha?.situacaoDg === 'vazia' && v.linha.emProtocolo === undefined))
const semensUsados = useSemensUsados()
const listaSemens = useId()
</script>

<template>
  <AppTela
    v-if="atendimento"
    titulo="Planilha IATF"
    :sobrelinha="`${propriedade?.nome ?? ''} · ${lote?.nome ?? ''} · ${plural(emProtocolo.length, 'vaca apta', 'vacas aptas')}`"
    :voltar="{ to: `/atendimentos/${atendimento.id}`, rotulo: lote?.nome ?? 'Lote' }"
    larga
  >
    <div class="pilha">
      <div class="campo">
        <label for="inseminador">Inseminador</label>
        <EntradaAoSair id="inseminador" placeholder="Nome do inseminador" :valor="atendimento.inseminador ?? ''" @salvar="atualizar({ inseminador: $event })" />
      </div>
      <p v-if="aguardandoServidor" class="cartao-suave">
        Algumas vacas vazias ainda não foram confirmadas pelo servidor. Elas entram na planilha assim que o aparelho sincronizar.
      </p>
      <div class="grade-cartoes">
        <LinhaPlanilha v-for="v in emProtocolo" :key="v.animal.id" :vaca="v" :lista-semens="listaSemens" @linha="atualizarVaca(v, $event)" />
      </div>
      <div v-if="!emProtocolo.length && !aguardandoServidor" class="vazio">Nenhuma vaca no protocolo.</div>
      <datalist :id="listaSemens">
        <option v-for="s in semensUsados" :key="s" :value="s" />
      </datalist>
    </div>
    <template #rodape>
      <div class="rodape">
        <span class="selo tom-verde">{{ plural(emProtocolo.length, 'animal', 'animais') }}</span>
        <label class="perdidos">
          Perdidos
          <EntradaAoSair
            type="number" min="0" inputmode="numeric" class="entrada-compacta" :valor="atendimento.animaisPerdidos"
            @salvar="atualizar({ animaisPerdidos: Math.max(0, Number($event) || 0) })" />
        </label>
        <NuxtLink :to="`/atendimentos/${atendimento.id}`" class="btn btn-primario concluir">Concluir</NuxtLink>
      </div>
    </template>
  </AppTela>
</template>

<style scoped>
.rodape { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.perdidos { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: var(--texto-suave); }
.perdidos .entrada { width: 72px; }
.concluir { flex: 1; min-width: 120px; }
</style>
