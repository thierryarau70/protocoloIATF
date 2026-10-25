<script setup lang="ts">
const route = useRoute()
const id = () => String(route.params.id)
const { lote, propriedade, animais, atendimentos } = useLote(id)
const busca = ref('')
const filtrados = computed(() => animais.value.filter(a => contem(a.numero, busca.value)))

async function novoDg() {
  const at = await iniciarAtendimento(id(), hoje())
  await navigateTo(`/atendimentos/${at.id}/dg`)
}
const linkAtendimento = (a: { id: string, status: string }) => (a.status === 'dg' ? `/atendimentos/${a.id}/dg` : `/atendimentos/${a.id}`)
</script>

<template>
  <div>
    <!-- Raiz sempre presente: com v-if na raiz a transição entre telas trava -->
    <AppTela
      v-if="lote"
      :titulo="lote.nome"
      :sobrelinha="propriedade?.nome"
      :voltar="{ to: `/propriedades/${lote.propriedadeId}`, rotulo: 'Propriedade' }"
      larga
    >
      <template #acao>
        <NuxtLink :to="`/lotes/${lote.id}/editar`" class="btn btn-contorno">Editar</NuxtLink>
      </template>
      <template #subtitulo>
        <div class="suave">{{ plural(animais.length, 'vaca') }}<template v-if="lote.localPrincipal"> · {{ lote.localPrincipal }}</template></div>
      </template>

      <div class="colunas">
        <section class="pilha-curta">
          <h2 class="titulo-secao">Vacas</h2>
          <CampoBusca v-model="busca" rotulo="Buscar vaca pelo número" numerico />
          <div class="lista-vacas">
            <NuxtLink v-for="a in filtrados" :key="a.id" :to="`/animais/${a.id}`" class="vaca">
              <span class="numero">{{ a.numero }}</span>
              <span class="suave">{{ [a.raca, a.peso ? `${a.peso} kg` : null].filter(Boolean).join(' · ') || 'Sem dados' }}</span>
              <span v-if="a.previsaoParto" class="selo tom-verde">Parto {{ formatarData(a.previsaoParto) }}</span>
            </NuxtLink>
          </div>
          <div v-if="busca && !filtrados.length" class="vazio">
            Nenhuma vaca com o número {{ busca }}.
            <NuxtLink :to="`/animais/nova?lote=${lote.id}&numero=${encodeURIComponent(busca)}`" class="btn btn-contorno">Cadastrar vaca {{ busca }}</NuxtLink>
          </div>
          <div v-else-if="!animais.length" class="vazio">Nenhuma vaca neste lote.</div>
        </section>

        <section class="pilha-curta">
          <h2 class="titulo-secao">Atendimentos</h2>
          <ItemLista
            v-for="a in atendimentos" :key="a.id" :to="linkAtendimento(a)"
            :titulo="`D0 ${formatarData(a.dataD0)}`"
            :subtitulo="`${a.tipo === 'so_dg' ? 'Só DG' : 'DG + IATF'} · ${rotuloStatus[a.status]}`"
          >
            <span v-if="a.resultado?.taxaPrenhez != null" class="selo tom-verde">Prenhez {{ formatarTaxa(a.resultado.taxaPrenhez) }}</span>
          </ItemLista>
          <div v-if="!atendimentos.length" class="vazio">Nenhum atendimento neste lote.</div>
        </section>
      </div>

      <template #rodape>
        <div class="acoes">
          <NuxtLink :to="`/animais/nova?lote=${lote.id}`" class="btn btn-contorno">+ Vaca</NuxtLink>
          <button type="button" class="btn btn-primario" @click="novoDg">Iniciar DG</button>
        </div>
      </template>
    </AppTela>
  </div>
</template>

<style scoped>
.colunas { display: flex; flex-direction: column; gap: 24px; }
.lista-vacas { display: flex; flex-direction: column; background: var(--superficie); border: 1px solid var(--borda); border-radius: var(--raio-grande); overflow: hidden; }
.lista-vacas:empty { display: none; }
.vaca { display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 8px 16px; border-bottom: 1px solid var(--borda-suave); }
.vaca:last-child { border-bottom: 0; }
.vaca:hover { background: var(--superficie-2); }
.numero { font-size: 16px; font-weight: 700; min-width: 56px; }
.vaca .suave { flex: 1; }
.acoes { display: flex; gap: 10px; }
.acoes .btn-primario { flex: 1; }

@media (min-width: 1024px) {
  .colunas { display: grid; grid-template-columns: 3fr 2fr; align-items: start; }
}
</style>
