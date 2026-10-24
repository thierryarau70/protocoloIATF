<script setup lang="ts">
const route = useRoute()
const id = () => String(route.params.id)
const { atendimento, lote, propriedade, vacas, contagem, carregando, atualizar, atualizarVaca } = useAtendimento(id)

const busca = ref('')
const filtradas = computed(() => vacas.value.filter(v => contem(v.animal.numero, busca.value)))
const soDg = computed(() => atendimento.value?.tipo === 'so_dg')
const sobrelinha = computed(() => [propriedade.value?.nome, lote.value?.nome, formatarData(atendimento.value?.dataD0)].filter(Boolean).join(' · '))
const tipos = [{ valor: 'dg_iatf' as const, rotulo: 'DG + IATF' }, { valor: 'so_dg' as const, rotulo: 'Só DG' }]

const novaVaca = computed(() => `/animais/nova?lote=${atendimento.value?.loteId}&atendimento=${id()}${busca.value ? `&numero=${encodeURIComponent(busca.value)}` : ''}`)
</script>

<template>
  <AppTela
    v-if="atendimento"
    :titulo="soDg ? 'DG' : 'DG + cadastro (D0)'"
    :sobrelinha="sobrelinha"
    :voltar="{ to: `/lotes/${atendimento.loteId}`, rotulo: 'Lote' }"
    larga
  >
    <template #topo>
      <div class="segmentado" role="group" aria-label="Tipo de atendimento">
        <button
          v-for="t in tipos" :key="t.valor" type="button" :aria-pressed="atendimento.tipo === t.valor"
          @click="atualizar({ tipo: t.valor })"
        >
          {{ t.rotulo }}
        </button>
      </div>
      <EtapasFluxo v-if="!soDg" :atual="3" />
    </template>

    <div class="pilha">
      <div class="estatisticas">
        <Estatistica :valor="contagem.prenha" rotulo="Prenhas" tom="verde" />
        <Estatistica :valor="contagem.vazia" :rotulo="soDg ? 'Vazias' : 'Vazias aptas'" tom="ambar" />
        <Estatistica :valor="contagem.descarte + contagem.refugo" rotulo="Desc./Refugo" tom="vermelho" />
        <Estatistica :valor="contagem.pendente" rotulo="Pendentes" />
      </div>
      <p class="dica">
        <template v-if="soDg">Fazenda sem inseminação: o atendimento termina na tabela do DG, sem protocolo.</template>
        <template v-else>Só as vazias aptas vão para o IATF. Prenhas, descartes e refugos ficam de fora.</template>
      </p>

      <CampoBusca v-model="busca" rotulo="Buscar vaca pelo número" numerico />

      <div class="lista">
        <LinhaDg
          v-for="v in filtradas" :key="v.animal.id" :vaca="v"
          @linha="atualizarVaca(v, $event)"
          @animal="atualizarAnimal(v.animal.id, $event)"
        />
      </div>
      <div v-if="busca && !filtradas.length" class="vazio">
        Nenhuma vaca com o número {{ busca }} neste lote.
        <NuxtLink :to="novaVaca" class="btn btn-contorno">Cadastrar vaca {{ busca }}</NuxtLink>
      </div>
      <div v-else-if="!carregando && !vacas.length" class="vazio">
        Nenhuma vaca neste lote. Cadastre pelo botão "+ Vaca".
      </div>
      <div v-else class="suave">Mostrando {{ filtradas.length }} de {{ plural(vacas.length, 'vaca') }}</div>
    </div>

    <template #rodape>
      <div class="acoes">
        <NuxtLink :to="novaVaca" class="btn btn-contorno">+ Vaca</NuxtLink>
        <NuxtLink v-if="soDg" :to="`/atendimentos/${atendimento.id}/tabela-dg`" class="btn btn-primario">Ver tabela do DG</NuxtLink>
        <NuxtLink v-else-if="contagem.vazia" :to="`/atendimentos/${atendimento.id}/protocolo`" class="btn btn-primario">
          Iniciar IATF · {{ plural(contagem.vazia, 'apta', 'aptas') }}
        </NuxtLink>
        <button v-else type="button" class="btn btn-primario" disabled>Iniciar IATF · nenhuma apta</button>
      </div>
    </template>
  </AppTela>
</template>

<style scoped>
.segmentado { max-width: 480px; display: flex; gap: 6px; padding: 4px; background: var(--neutro-suave); border-radius: var(--raio); margin-top: 4px; }
.segmentado button { flex: 1; min-height: 44px; border: 0; border-radius: 9px; background: transparent; color: var(--texto-2); font-size: 14px; font-weight: 500; }
.segmentado button[aria-pressed='true'] { background: var(--superficie); color: var(--primaria); font-weight: 700; box-shadow: 0 1px 2px rgba(27, 42, 34, .08); }
.estatisticas { display: flex; gap: 6px; }
.estatisticas :deep(.estatistica) { padding: 8px; }
.lista { margin: 0 calc(var(--lateral) * -1); border-top: 1px solid var(--borda); }
.lista:empty { display: none; }
.lista :deep(.linha) { padding-left: var(--lateral); padding-right: var(--lateral); }
.acoes { display: flex; gap: 10px; }
.acoes .btn-primario { flex: 1; }

@media (min-width: 720px) {
  .lista { margin: 0; border: 1px solid var(--borda); border-radius: var(--raio-grande); overflow: hidden; }
  .lista :deep(.linha) { padding-left: 16px; padding-right: 16px; }
  .lista :deep(.detalhes) { flex-direction: row; }
  .lista :deep(.detalhes .campo), .lista :deep(.detalhes .linha-campos) { flex: 1; }
}
</style>
