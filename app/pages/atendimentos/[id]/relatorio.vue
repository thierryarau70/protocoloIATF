<script setup lang="ts">
// Página limpa para imprimir ou salvar em PDF (no celular: Compartilhar/Imprimir → Salvar PDF)
definePageMeta({ layout: 'vazio' })

const route = useRoute()
const id = () => String(route.params.id)
const { atendimento, lote, propriedade, perfil, soDg, tabela, titulo, taxaPrenhez, baixarPlanilha } = useRelatorio(id)
const r = computed(() => atendimento.value?.resultado)
const emitido = formatarData(hoje())

useHead({ title: () => [titulo.value, propriedade.value?.nome, lote.value?.nome].filter(Boolean).join(' · ') })

const dados = computed(() => {
  const a = atendimento.value
  if (!a) return []
  const itens: [string, string][] = [
    ['Propriedade', propriedade.value?.nome ?? '—'],
    ['Proprietário', propriedade.value?.proprietario || '—'],
    ['Local', propriedade.value?.local || '—'],
    ['Lote', lote.value?.nome ?? '—'],
    ['DG (D0)', formatarData(a.dataD0)],
  ]
  if (!soDg.value) {
    itens.push(
      ['D8 · retirada', formatarData(a.dataD8)],
      ['D10 · inseminação', formatarData(a.dataD10)],
      ['D45 · DG final', formatarData(a.dataD45)],
      ['Inseminador', a.inseminador || '—'],
      ['Animais perdidos', String(a.animaisPerdidos)],
    )
  }
  return itens
})

const numeros = computed(() => {
  const x = r.value
  if (!x) return []
  const lista: [string, string][] = [
    ['Prenhas no DG', String(x.dg.prenha)],
    ['Vazias', String(x.dg.vazia)],
    ['Descarte', String(x.dg.descarte)],
    ['Refugo', String(x.dg.refugo)],
  ]
  if (!soDg.value) {
    lista.push(
      ['Inseminadas', String(x.inseminadas)],
      ['Não inseminadas', String(x.naoInseminadas)],
      ['Prenhas no D45', String(x.prenhasD45)],
      ['Taxa de inseminação', formatarTaxa(x.taxaInseminacao)],
      ['Taxa de prenhez', taxaPrenhez.value],
    )
  }
  return lista
})
const semenComResultado = computed(() => (r.value && r.value.prenhasD45 + r.value.vaziasD45 > 0 ? r.value.semen : []))

function imprimir() {
  window.print()
}
</script>

<template>
  <div v-if="atendimento" class="relatorio-pagina">
    <nav class="barra no-print" aria-label="Ações do relatório">
      <NuxtLink :to="`/atendimentos/${atendimento.id}`" class="voltar">
        <Icone nome="voltar" />
        Voltar
      </NuxtLink>
      <div class="acoes">
        <button type="button" class="btn btn-contorno" @click="baixarPlanilha">Baixar planilha</button>
        <button type="button" class="btn btn-primario" @click="imprimir">Imprimir / salvar PDF</button>
      </div>
    </nav>

    <article class="folha">
      <header class="cabecalho">
        <div class="vet">
          <img v-if="perfil?.logoUrl" :src="perfil.logoUrl" alt="" class="logo">
          <div>
            <strong class="vet-nome">{{ perfil?.nome ?? '' }}</strong>
            <div class="suave">
              {{ [perfil?.crmv && `CRMV ${perfil.crmv}`, perfil?.empresa, perfil?.local, perfil?.contato].filter(Boolean).join(' · ') }}
            </div>
          </div>
        </div>
        <div class="titulo-bloco">
          <h1>{{ titulo }}</h1>
          <div class="suave">Emitido em {{ emitido }}</div>
        </div>
      </header>

      <dl class="dados">
        <div v-for="[rotulo, valor] in dados" :key="rotulo"><dt>{{ rotulo }}</dt><dd>{{ valor }}</dd></div>
      </dl>

      <section v-if="r" class="secao">
        <h2>Resultado</h2>
        <dl class="numeros">
          <div v-for="[rotulo, valor] in numeros" :key="rotulo"><dd :class="{ texto: !/^[d,.%]+$/.test(valor) }">{{ valor }}</dd><dt>{{ rotulo }}</dt></div>
        </dl>
        <p v-if="!soDg && r.prenhasD45 && atendimento.previsaoParto" class="parto">
          Previsão de parto das prenhas do IATF: <strong>{{ formatarData(atendimento.previsaoParto) }}</strong>
        </p>
      </section>
      <p v-else class="aviso no-print">O resultado aparece depois que o aparelho sincronizar com o servidor.</p>

      <section v-if="!soDg && semenComResultado.length" class="secao">
        <h2>Prenhez por sêmen</h2>
        <table class="tabela-rel">
          <thead><tr><th>Sêmen</th><th>Inseminadas</th><th>Prenhas</th><th>Taxa</th></tr></thead>
          <tbody>
            <tr v-for="s in semenComResultado" :key="s.rotulo">
              <td>{{ s.rotulo }}</td><td>{{ s.inseminadas }}</td><td>{{ s.prenhas }}</td><td>{{ formatarTaxa(s.taxaPrenhez) }}</td>
            </tr>
          </tbody>
        </table>
      </section>

      <section class="secao">
        <h2>Animais ({{ tabela.linhas.length }})</h2>
        <table v-if="tabela.linhas.length" class="tabela-rel tabela-vacas">
          <thead><tr><th v-for="c in tabela.cabecalho" :key="c">{{ c }}</th></tr></thead>
          <tbody>
            <tr v-for="linha in tabela.linhas" :key="linha[0]">
              <td v-for="(celula, i) in linha" :key="i">{{ celula || '—' }}</td>
            </tr>
          </tbody>
        </table>
        <p v-else class="suave">Nenhuma vaca avaliada ainda.</p>
      </section>

      <footer class="assinatura">
        <div class="linha-assinatura" />
        <div>{{ perfil?.nome ?? 'Médico(a) veterinário(a)' }}<template v-if="perfil?.crmv"> · CRMV {{ perfil.crmv }}</template></div>
      </footer>
    </article>
  </div>
</template>

<style scoped>
.relatorio-pagina { min-height: 100dvh; background: var(--fundo); padding-bottom: 40px; }
.barra {
  position: sticky; top: 0; z-index: 5; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap;
  padding: calc(env(safe-area-inset-top) + 10px) var(--lateral) 10px; background: var(--superficie); border-bottom: 1px solid var(--borda);
}
.voltar { display: inline-flex; align-items: center; gap: 4px; min-height: 44px; font-size: 14px; font-weight: 500; color: var(--primaria); }
.acoes { display: flex; gap: 8px; flex-wrap: wrap; }

.folha {
  max-width: 900px; margin: 20px auto 0; padding: 32px; background: #FFFFFF; color: #1B2A22;
  border: 1px solid var(--borda); border-radius: var(--raio-grande); display: flex; flex-direction: column; gap: 22px;
}
.cabecalho { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; padding-bottom: 16px; border-bottom: 2px solid var(--primaria); }
.vet { display: flex; align-items: center; gap: 14px; }
.logo { width: 64px; height: 64px; object-fit: contain; }
.vet-nome { font-size: 18px; }
.titulo-bloco { text-align: right; }
.titulo-bloco h1 { font-size: 22px; color: var(--primaria); }
.dados { margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 10px 20px; }
.dados div { display: flex; flex-direction: column; gap: 2px; }
.dados dt, .numeros dt { font-size: 12px; font-weight: 500; color: var(--texto-suave); text-transform: uppercase; letter-spacing: .04em; }
.dados dd { margin: 0; font-size: 15px; font-weight: 500; }
.secao { display: flex; flex-direction: column; gap: 10px; }
.secao h2 { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: var(--texto-suave); }
.numeros { margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 8px; }
.numeros div { padding: 10px 12px; border: 1px solid var(--borda); border-radius: 10px; }
.numeros dd { margin: 0; font-size: 22px; font-weight: 700; }
.numeros dd.texto { font-size: 16px; line-height: 1.7; }
.parto { font-size: 15px; }
.tabela-rel { width: 100%; border-collapse: collapse; font-size: 13px; }
.tabela-rel th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .03em; color: var(--texto-suave); padding: 6px 8px; border-bottom: 2px solid var(--borda); }
.tabela-rel td { padding: 6px 8px; border-bottom: 1px solid var(--borda-suave); }
.tabela-vacas td:first-child { font-weight: 700; }
.aviso { color: var(--texto-suave); }
.assinatura { margin-top: 28px; align-self: flex-end; width: min(320px, 100%); text-align: center; font-size: 13px; display: flex; flex-direction: column; gap: 6px; }
.linha-assinatura { border-top: 1px solid #1B2A22; height: 36px; }

@media (max-width: 719px) {
  .folha { margin: 0; border-radius: 0; border-left: 0; border-right: 0; padding: 20px 16px; }
  .titulo-bloco { text-align: left; }
  .tabela-vacas { display: block; overflow-x: auto; }
}

@media print {
  @page { size: A4; margin: 14mm 12mm; }
  .no-print { display: none !important; }
  .relatorio-pagina { background: #FFFFFF; padding: 0; min-height: 0; }
  .folha { max-width: none; margin: 0; padding: 0; border: 0; border-radius: 0; gap: 16px; }
  .tabela-vacas { display: table; }
  .tabela-rel tr { break-inside: avoid; }
  .tabela-rel thead { display: table-header-group; }
  .numeros div { break-inside: avoid; }
}
</style>
