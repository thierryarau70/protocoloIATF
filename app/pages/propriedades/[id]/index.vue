<script setup lang="ts">
const route = useRoute()
const id = () => String(route.params.id)
const { propriedade, lotes, carregando } = usePropriedade(id)
const totalAnimais = computed(() => lotes.value.reduce((s, l) => s + l.totalAnimais, 0))
const semen = { particular: 'Particular', misto: 'Misto' } as const
const { semens } = useSemens(id)
</script>

<template>
  <div>
    <!-- Raiz sempre presente: com v-if na raiz a transição entre telas trava -->
    <AppTela
      v-if="propriedade"
      :titulo="propriedade.nome"
      sobrelinha="Propriedade"
      :voltar="{ to: '/propriedades', rotulo: 'Propriedades' }"
      larga
    >
      <template #acao>
        <NuxtLink :to="`/propriedades/${propriedade.id}/editar`" class="btn btn-contorno editar">Editar</NuxtLink>
      </template>

      <div class="colunas">
        <div class="pilha">
          <section class="cartao">
            <dl class="dados">
              <div><dt>Proprietário</dt><dd>{{ propriedade.proprietario || '—' }}</dd></div>
              <div><dt>Local</dt><dd>{{ propriedade.local || '—' }}</dd></div>
              <div><dt>Inscrição</dt><dd>{{ propriedade.inscricao || '—' }}</dd></div>
              <div><dt>Tipo de sêmen</dt><dd>{{ propriedade.semenTipo ? semen[propriedade.semenTipo] : '—' }}</dd></div>
            </dl>
          </section>

          <section class="pilha-curta">
            <h2 class="titulo-secao">Sêmen</h2>
            <div v-if="semens.length" class="lista-semen">
              <NuxtLink v-for="s in semens" :key="s.id" :to="`/propriedades/${propriedade.id}/semen/${s.id}`" class="item-semen">
                <span class="corpo">
                  <span class="nome">{{ s.nome }}</span>
                  <span v-if="detalheSemen(s)" class="suave">{{ detalheSemen(s) }}</span>
                </span>
                <Icone nome="avancar" />
              </NuxtLink>
            </div>
            <p v-else class="dica">Nenhum sêmen cadastrado. Cadastre para escolher na planilha IATF.</p>
            <NuxtLink :to="`/propriedades/${propriedade.id}/semen/novo`" class="btn btn-tracejado btn-bloco">
              <Icone nome="mais" />
              Cadastrar sêmen
            </NuxtLink>
          </section>

          <section class="pilha-curta">
            <h2 class="titulo-secao">Resumo</h2>
            <div class="resumo">
              <NuxtLink to="/lotes" class="cartao resumo-item">
                <Estatistica :valor="totalAnimais" rotulo="Animais" tom="plano" />
              </NuxtLink>
              <NuxtLink :to="`/iatf?propriedade=${propriedade.id}`" class="cartao resumo-item">
                <Estatistica :valor="propriedade.resumo?.iatf ?? 0" rotulo="IATF" tom="plano" />
              </NuxtLink>
              <div class="cartao resumo-item">
                <Estatistica :valor="formatarTaxa(propriedade.resumo?.taxaPrenhez)" rotulo="Taxa de prenhez" tom="plano" />
              </div>
            </div>
          </section>
        </div>

        <section class="pilha-curta">
          <h2 class="titulo-secao">Lotes</h2>
          <ItemLista
            v-for="l in lotes" :key="l.id" :to="`/lotes/${l.id}`" :titulo="l.nome"
            :subtitulo="plural(l.totalAnimais, 'vaca')"
          />
          <div v-if="!carregando && !lotes.length" class="vazio">Nenhum lote nesta propriedade.</div>
          <NuxtLink :to="`/lotes/novo?propriedade=${propriedade.id}`" class="btn btn-tracejado btn-bloco">
            <Icone nome="mais" />
            Novo lote
          </NuxtLink>
        </section>
      </div>
    </AppTela>
  </div>
</template>

<style scoped>
.dados { margin: 0; display: flex; flex-direction: column; gap: 12px; }
.dados div { display: flex; justify-content: space-between; gap: 12px; }
dt { font-size: 14px; color: var(--texto-suave); }
dd { margin: 0; font-size: 15px; font-weight: 700; text-align: right; }
.resumo { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.resumo-item { padding: 6px; }
.colunas { display: flex; flex-direction: column; gap: 24px; }
.lista-semen { display: flex; flex-direction: column; background: var(--superficie); border: 1px solid var(--borda); border-radius: var(--raio-grande); overflow: hidden; }
.item-semen { display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 8px 16px; border-bottom: 1px solid var(--borda-suave); color: var(--texto-suave); }
.item-semen:last-child { border-bottom: 0; }
.item-semen:hover { background: var(--superficie-2); }
.item-semen .corpo { flex: 1; display: flex; flex-direction: column; gap: 2px; }
.item-semen .nome { font-size: 16px; font-weight: 700; color: var(--texto); }

@media (min-width: 1024px) {
  .colunas { display: grid; grid-template-columns: 1fr 1fr; align-items: start; }
}
</style>
