<script setup lang="ts">
const route = useRoute()
const id = () => String(route.params.id)
const { atendimento, lote, propriedade, vacas } = useAtendimento(id)

const soDg = computed(() => atendimento.value?.tipo === 'so_dg')
const r = computed(() => atendimento.value?.resultado)
const emProtocolo = computed(() => vacas.value.filter(v => v.linha?.emProtocolo))
const avaliadas = computed(() => vacas.value.filter(v => v.linha && v.linha.situacaoDg !== 'pendente'))
const naoInseminadas = computed(() => vacas.value.filter(v => v.linha?.inseminada === false))

// Etapa atual pelo calendário calculado no servidor
const etapa = computed(() => {
  const a = atendimento.value
  if (!a || a.status === 'finalizado') return 'fim'
  if (!a.dataD45 || hoje() < a.dataD45) return 'planilha'
  return 'd45'
})

const graficoDg = computed(() => r.value
  ? [
      { rotulo: 'Prenha', valor: r.value.dg.prenha, tom: 'verde' as const },
      { rotulo: 'Vazia', valor: r.value.dg.vazia, tom: 'ambar' as const },
      { rotulo: 'Descarte', valor: r.value.dg.descarte, tom: 'vermelho' as const },
      { rotulo: 'Refugo', valor: r.value.dg.refugo, tom: 'neutro' as const },
    ]
  : [])
const graficoIatf = computed(() => r.value
  ? [
      { rotulo: 'Inseminadas', valor: r.value.inseminadas, tom: 'verde' as const },
      { rotulo: 'Não insem.', valor: r.value.naoInseminadas, tom: 'vermelho' as const },
      { rotulo: 'Prenhas D45', valor: r.value.prenhasD45, tom: 'verde' as const },
      { rotulo: 'Vazias D45', valor: r.value.vaziasD45, tom: 'ambar' as const },
    ]
  : [])
const dia = { d7: 'D7', d8: 'D8', d9: 'D9' } as const
const data = (d?: string) => (d ? formatarData(d) : 'ao sincronizar')
</script>

<template>
  <AppTela
    v-if="atendimento"
    :titulo="soDg ? `${lote?.nome ?? ''} · resultado do DG` : `${lote?.nome ?? ''} · protocolo IATF`"
    :sobrelinha="propriedade?.nome"
    :voltar="{ to: `/lotes/${atendimento.loteId}`, rotulo: 'Lote' }"
    larga
  >
    <template #subtitulo>
      <div class="suave">
        <template v-if="soDg">{{ plural(avaliadas.length, 'vaca avaliada', 'vacas avaliadas') }} · {{ formatarData(atendimento.dataD0) }}</template>
        <template v-else>{{ plural(emProtocolo.length, 'vaca apta', 'vacas aptas') }} em protocolo · iniciado em {{ formatarData(atendimento.dataD0) }}</template>
      </div>
    </template>

    <div class="colunas">
      <section v-if="!soDg" class="pilha-curta">
        <h2 class="titulo-secao">Cronograma</h2>
        <div class="cartao etapa">
          <span class="dia feito"><Icone nome="check" :tamanho="24" /></span>
          <div class="texto">
            <div class="nome">D0 · Ultrassom + implante</div>
            <div class="suave">Concluído em {{ formatarData(atendimento.dataD0) }}</div>
          </div>
        </div>
        <div class="cartao etapa" :class="{ 'cartao-destaque': etapa === 'planilha' }">
          <div class="etapa-linha">
            <span class="dia">D8</span>
            <div class="texto">
              <div class="nome">Retirada do implante + hormônio</div>
              <div class="suave">{{ data(atendimento.dataD8) }}<template v-if="atendimento.horaD8"> · {{ atendimento.horaD8.slice(0, 5) }}</template><template v-if="atendimento.gnrh !== null"> · GnRH {{ atendimento.gnrh ? 'sim' : 'não' }}</template></div>
            </div>
          </div>
          <div class="etapa-linha">
            <span class="dia">D10</span>
            <div class="texto">
              <div class="nome">Inseminação</div>
              <div class="suave">{{ data(atendimento.dataD10) }}<template v-if="atendimento.horaD10"> · {{ atendimento.horaD10.slice(0, 5) }}</template></div>
            </div>
          </div>
          <NuxtLink :to="`/atendimentos/${atendimento.id}/planilha`" class="btn" :class="etapa === 'planilha' ? 'btn-primario' : 'btn-contorno'">Abrir planilha IATF</NuxtLink>
        </div>
        <NuxtLink :to="`/atendimentos/${atendimento.id}/d45`" class="cartao etapa futura" :class="{ 'cartao-destaque': etapa === 'd45' }">
          <div class="etapa-linha">
            <span class="dia dia-neutro">D45</span>
            <div class="texto">
              <div class="nome">DG final</div>
              <div class="suave">{{ data(atendimento.dataD45) }} · emprenhou ou não</div>
            </div>
            <Icone nome="avancar" />
          </div>
        </NuxtLink>
      </section>

      <section class="pilha-curta">
        <h2 class="titulo-secao">Resultado</h2>
        <template v-if="r">
          <div v-if="!soDg" class="estatisticas">
            <Estatistica :valor="formatarTaxa(r.taxaInseminacao)" rotulo="Taxa de inseminação" tom="verde" />
            <Estatistica :valor="formatarTaxa(r.taxaPrenhez)" rotulo="Taxa de prenhez" tom="forte" />
          </div>
          <div class="cartao"><GraficoBarras titulo="Resultado do DG" :itens="graficoDg" /></div>
          <div v-if="!soDg" class="cartao"><GraficoBarras titulo="IATF" :itens="graficoIatf" /></div>
          <div v-if="!soDg && r.prenhasD45" class="cartao-suave">
            Previsão de parto das prenhas do IATF: <strong>{{ formatarData(atendimento.previsaoParto) }}</strong>
          </div>
          <div v-if="naoInseminadas.length" class="cartao pilha-curta">
            <h3 class="titulo-secao">Não inseminadas</h3>
            <div v-for="v in naoInseminadas" :key="v.animal.id" class="justificativa">
              <strong>{{ v.animal.numero }}</strong> {{ v.linha?.justificativaNaoInseminada }}
            </div>
          </div>
        </template>
        <p v-else class="cartao-suave">O resultado aparece depois que o aparelho sincronizar com o servidor.</p>
      </section>
    </div>

    <section v-if="!soDg && emProtocolo.length" class="pilha-curta tabela-secao">
      <h2 class="titulo-secao">Tabela do lote</h2>
      <div class="tabela-rolagem">
        <table class="tabela">
          <thead>
            <tr><th scope="col">Nº vaca</th><th scope="col">Situação</th><th scope="col">D8/7/9</th><th scope="col">D10</th><th scope="col">Obs.</th><th scope="col">D45</th></tr>
          </thead>
          <tbody>
            <tr v-for="v in emProtocolo" :key="v.animal.id">
              <td class="numero">{{ v.animal.numero }}</td>
              <td><span class="selo tom-ambar">Apta</span></td>
              <td>{{ v.linha?.hormonioDia ? dia[v.linha.hormonioDia] : '—' }}</td>
              <td>{{ v.linha?.inseminada === true ? 'Inseminada' : v.linha?.inseminada === false ? 'Não' : '—' }}</td>
              <td>{{ v.linha?.obs || v.linha?.justificativaNaoInseminada || '—' }}</td>
              <td>
                <span v-if="v.linha?.resultadoD45" class="selo" :class="v.linha.resultadoD45 === 'prenha' ? 'tom-verde' : 'tom-ambar'">{{ rotuloSituacao[v.linha.resultadoD45] }}</span>
                <template v-else>—</template>
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td colspan="6">
                Inseminador: {{ atendimento.inseminador || '—' }} · {{ plural(emProtocolo.length, 'animal', 'animais') }} ·
                Perdidos: {{ atendimento.animaisPerdidos }} · Taxa de prenhez: {{ formatarTaxa(r?.taxaPrenhez) }}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </section>

    <template #rodape>
      <NuxtLink v-if="atendimento.status === 'dg'" :to="`/atendimentos/${atendimento.id}/dg`" class="btn btn-primario btn-bloco">Continuar DG</NuxtLink>
      <NuxtLink v-else to="/dg" class="btn btn-contorno btn-bloco">Novo atendimento</NuxtLink>
    </template>
  </AppTela>
</template>

<style scoped>
.colunas { display: flex; flex-direction: column; gap: 24px; }
.etapa { display: flex; flex-direction: column; gap: 12px; padding: 14px 16px; }
.etapa:first-of-type { flex-direction: row; align-items: center; }
.etapa-linha { display: flex; align-items: center; gap: 12px; }
.futura { background: var(--superficie-2); border-style: dashed; border-color: #AFBDB2; color: var(--texto-suave); }
.futura.cartao-destaque { border-style: solid; border-color: var(--primaria); background: var(--superficie); }
.dia { width: 48px; height: 48px; flex: none; display: flex; align-items: center; justify-content: center; border-radius: 24px; background: var(--primaria-suave); color: var(--primaria); font-size: 16px; font-weight: 700; }
.feito { background: var(--primaria); color: #FFFFFF; }
.dia-neutro { background: var(--neutro-suave); color: var(--texto-2); }
.texto { flex: 1; display: flex; flex-direction: column; gap: 2px; color: var(--texto); }
.nome { font-size: 16px; font-weight: 700; }
.estatisticas { display: flex; gap: 8px; }
.estatisticas :deep(.estatistica) { padding: 12px; }
.justificativa { font-size: 14px; }
.tabela-secao { margin-top: 24px; }

@media (min-width: 1024px) {
  .colunas { display: grid; grid-template-columns: 1fr 1fr; align-items: start; }
}
</style>
