<script setup lang="ts">
import type { Agrupado } from '~/utils/indicadores'

const route = useRoute()
const id = () => String(route.params.id)
const { dados, carregando } = useDadosGerais()

const propriedade = computed(() => dados.value.propriedades.find(p => p.id === id()))
const lotes = computed(() => dados.value.lotes.filter(l => l.propriedadeId === id()))
const resultados = computed(() => resultadosIatf(dados.value.atendimentos, lotes.value))
const porLote = computed(() => agrupar(resultados.value, r => r.lote))
const porInseminador = computed(() => agrupar(resultados.value, r => r.inseminador || 'Não informado'))
const problema = computed(() => vacasProblema(dados.value.animais, lotes.value, dados.value.atendimentos, dados.value.linhas))
const partos = computed(() => partosPrevistos(dados.value.animais, lotes.value, dados.value.atendimentos, dados.value.linhas, hoje()))

const geral = computed(() => {
  const inseminadas = resultados.value.reduce((s, r) => s + r.inseminadas, 0)
  const prenhas = resultados.value.reduce((s, r) => s + r.prenhas, 0)
  return { inseminadas, prenhas, taxa: inseminadas ? Math.round((prenhas / inseminadas) * 1000) / 10 : null }
})

const dataCurta = (d: string) => `${d.slice(8, 10)}/${d.slice(5, 7)}/${d.slice(2, 4)}`
const linhaDoTempo = computed(() => resultados.value.map(r => ({
  rotulo: `${dataCurta(r.data)} · ${r.lote}`,
  taxa: r.taxa,
  detalhe: `${r.prenhas} de ${r.inseminadas} inseminadas emprenharam${r.inseminador ? ` · ${r.inseminador}` : ''}`,
})))
const grupo = (g: Agrupado) => ({
  rotulo: g.rotulo,
  taxa: g.taxa,
  detalhe: `${plural(g.iatf, 'IATF')} · ${g.prenhas} de ${g.inseminadas} emprenharam`,
})
const nomeMes = new Intl.DateTimeFormat('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' })
// "outubro de 2026" -> "Outubro de 2026" (só a primeira letra: o CSS capitalize faria "De")
const mes = (m: string) => nomeMes.format(new Date(`${m}-01T00:00:00Z`)).replace(/^./, c => c.toUpperCase())
</script>

<template>
  <div>
    <!-- Raiz sempre presente: com v-if na raiz a transição entre telas trava -->
    <AppTela
      v-if="propriedade"
      titulo="Painel da fazenda"
      :sobrelinha="propriedade.nome"
      :voltar="{ to: `/propriedades/${propriedade.id}`, rotulo: 'Fazenda' }"
      larga
    >
      <div class="colunas">
        <div class="pilha">
          <div class="estatisticas">
            <div class="cartao"><Estatistica :valor="resultados.length" rotulo="IATF finalizados" tom="plano" /></div>
            <div class="cartao"><Estatistica :valor="geral.inseminadas" rotulo="Inseminadas" tom="plano" /></div>
            <div class="cartao"><Estatistica :valor="formatarTaxa(geral.taxa)" rotulo="Taxa de prenhez" tom="forte" /></div>
          </div>

          <div class="cartao">
            <GraficoTaxa
              v-if="linhaDoTempo.length" titulo="Prenhez a cada IATF" :itens="linhaDoTempo"
              descricao="Do mais antigo para o mais recente: mostra se o resultado da fazenda está melhorando."
            />
            <p v-else class="dica">A taxa de cada IATF aparece aqui depois do primeiro DG final (D45) desta fazenda.</p>
          </div>

          <div v-if="porLote.length > 1" class="cartao">
            <GraficoTaxa titulo="Por lote" :itens="porLote.map(grupo)" descricao="Todos os IATF finalizados de cada lote somados." />
          </div>
          <div v-if="porInseminador.length > 1" class="cartao">
            <GraficoTaxa titulo="Por inseminador" :itens="porInseminador.map(grupo)" descricao="Todos os IATF finalizados de cada inseminador somados." />
          </div>
        </div>

        <div class="pilha">
          <section class="pilha-curta">
            <h2 class="titulo-secao">Vacas com falhas seguidas</h2>
            <p class="dica">Entraram no protocolo e não emprenharam em 2 ou mais IATF seguidos: avaliar ou descartar.</p>
            <ItemLista
              v-for="v in problema" :key="v.animalId" :to="`/animais/${v.animalId}`"
              :titulo="`Vaca ${v.numero}`" :subtitulo="`${v.lote} · ${v.falhasSeguidas} falhas seguidas em ${plural(v.protocolos, 'protocolo')}`"
            >
              <span class="selo tom-vermelho">{{ v.falhasSeguidas }}× sem emprenhar</span>
            </ItemLista>
            <p v-if="!problema.length && !carregando" class="cartao-suave">Nenhuma vaca com 2 falhas seguidas.</p>
          </section>

          <section class="pilha-curta">
            <h2 class="titulo-secao">Partos previstos</h2>
            <div v-for="m in partos" :key="m.mes" class="cartao mes">
              <div class="mes-topo">
                <strong class="mes-nome">{{ mes(m.mes) }}</strong>
                <span class="selo tom-verde">{{ plural(m.partos.length, 'parto') }}</span>
              </div>
              <div class="vacas">
                <NuxtLink v-for="p in m.partos" :key="p.animalId" :to="`/animais/${p.animalId}`" class="vaca">
                  <strong>{{ p.numero }}</strong>
                  <span class="suave">{{ formatarData(p.data).slice(0, 5) }} · {{ p.lote }}</span>
                </NuxtLink>
              </div>
            </div>
            <p v-if="!partos.length && !carregando" class="cartao-suave">
              Nenhum parto previsto. A previsão vem das prenhas do IATF (D45) e da data anotada no DG.
            </p>
          </section>
        </div>
      </div>
    </AppTela>
  </div>
</template>

<style scoped>
.colunas { display: flex; flex-direction: column; gap: 24px; }
.estatisticas { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.estatisticas .cartao { padding: 6px; }
.mes { display: flex; flex-direction: column; gap: 10px; }
.mes-topo { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.mes-nome { font-size: 16px; }
.vacas { display: flex; flex-wrap: wrap; gap: 6px; }
.vaca {
  display: flex; flex-direction: column; min-width: 92px; padding: 8px 10px; border: 1px solid var(--borda); border-radius: 10px;
  transition: border-color var(--rapido);
}
.vaca:hover { border-color: var(--primaria); }
.vaca strong { font-size: 15px; }

@media (min-width: 1024px) {
  .colunas { display: grid; grid-template-columns: 1fr 1fr; align-items: start; }
}
</style>
