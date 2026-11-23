<script setup lang="ts">
const route = useRoute()
const id = () => String(route.params.id)
const { atendimento, lote, propriedade, vacas, contagem, atualizar, atualizarVaca } = useAtendimento(id)

// Quem está no protocolo é decidido pelo servidor (emProtocolo)
const emProtocolo = computed(() => vacas.value.filter(v => v.linha?.emProtocolo))
const aguardandoServidor = computed(() => contagem.value.vazia > 0 && vacas.value.some(v => v.linha?.situacaoDg === 'vazia' && v.linha.emProtocolo === undefined))
const { semens } = useSemens(() => propriedade.value?.id)
// Resumo da configuração do lote, com atalho para alterar
const configuracao = computed(() => {
  const a = atendimento.value
  if (!a || a.vacinaReprodutiva === null || a.diaHormonio === null || a.gnrh === null || (!a.semenId && !a.variosTouros)) return null
  const touro = a.variosTouros ? 'vários touros' : semens.value.find(s => s.id === a.semenId)?.nome ?? 'touro do lote'
  return [`Vacina reprodutiva: ${a.vacinaReprodutiva ? 'sim' : 'não'}`, `Hormônio no ${a.diaHormonio.toUpperCase()}`, `GnRH na IA: ${a.gnrh ? 'sim' : 'não'}`, `Touro: ${touro}`]
})
const cadastrarSemen = computed(() => `/propriedades/${propriedade.value?.id}/semen/novo?voltar=${encodeURIComponent(route.path)}`)
</script>

<template>
  <div>
    <!-- Raiz sempre presente: com v-if na raiz a transição entre telas trava -->
    <AppTela
      v-if="atendimento"
      titulo="Planilha IATF"
      :sobrelinha="`${propriedade?.nome ?? ''} · ${lote?.nome ?? ''} · ${plural(emProtocolo.length, 'vaca apta', 'vacas aptas')}`"
      :voltar="{ to: `/atendimentos/${atendimento.id}`, rotulo: lote?.nome ?? 'Lote' }"
      larga
    >
      <div class="pilha">
        <div class="config" :class="{ pendente: !configuracao }">
          <div class="config-itens">
            <template v-if="configuracao">
              <span v-for="c in configuracao" :key="c" class="config-item">{{ c }}</span>
            </template>
            <span v-else>Configuração IATF do lote ainda não confirmada.</span>
          </div>
          <NuxtLink :to="`/atendimentos/${atendimento.id}/configuracao`" class="config-editar">{{ configuracao ? 'Alterar' : 'Configurar' }}</NuxtLink>
        </div>
        <div class="campo">
          <label for="inseminador">Inseminador</label>
          <EntradaAoSair id="inseminador" placeholder="Nome do inseminador" :valor="atendimento.inseminador ?? ''" @salvar="atualizar({ inseminador: $event })" />
        </div>
        <p v-if="aguardandoServidor" class="cartao-suave">
          Algumas vacas vazias ainda não foram confirmadas pelo servidor. Elas entram na planilha assim que o aparelho sincronizar.
        </p>
        <div class="grade-cartoes">
          <LinhaPlanilha v-for="v in emProtocolo" :key="v.animal.id" :vaca="v" :semens="semens" :cadastrar-semen="cadastrarSemen" :semen-padrao="atendimento.semenId" @linha="atualizarVaca(v, $event)" />
        </div>
        <div v-if="!emProtocolo.length && !aguardandoServidor" class="vazio">Nenhuma vaca no protocolo.</div>
        <NuxtLink v-if="semens.length" :to="cadastrarSemen" class="btn btn-tracejado btn-bloco">+ Cadastrar outro sêmen</NuxtLink>
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
          <a :href="`/atendimentos/${atendimento.id}`" class="btn btn-primario concluir" @click.prevent="concluirPara(`/atendimentos/${atendimento.id}`)">Concluir</a>
        </div>
      </template>
    </AppTela>
  </div>
</template>

<style scoped>
.config { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 10px 14px; border-radius: var(--raio); background: var(--primaria-suave); color: var(--primaria); font-size: 14px; }
.config.pendente { background: var(--ambar-suave); color: var(--ambar-texto); }
.config-itens { display: flex; flex-wrap: wrap; gap: 4px 14px; font-weight: 500; }
.config-editar { min-height: 44px; display: inline-flex; align-items: center; font-weight: 700; text-decoration: underline; text-underline-offset: 3px; }
.rodape { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.perdidos { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: var(--texto-suave); }
.perdidos .entrada { width: 72px; }
.concluir { flex: 1; min-width: 120px; }
</style>
