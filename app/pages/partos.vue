<script setup lang="ts">
/**
 * Relatório de previsão de parto, para imprimir/salvar em PDF ou baixar para o Excel.
 * Com ?atendimento=ID mostra só aquele lote (aberto pelo atendimento depois do D10);
 * sem ele, todos os lotes feitos, com filtro por fazenda (aberto pelo menu inicial).
 */
import type { LinhaRelatorioParto } from '~/utils/indicadores'

definePageMeta({ layout: 'vazio' })

const route = useRoute()
const atendimentoId = computed(() => (route.query.atendimento ? String(route.query.atendimento) : undefined))
const { dados } = useDadosGerais()
const { perfil, carregar } = usePerfil()
onMounted(carregar)

const fazenda = ref('')
const atendimento = computed(() => dados.value.atendimentos.find(a => a.id === atendimentoId.value))
const loteDoAtendimento = computed(() => dados.value.lotes.find(l => l.id === atendimento.value?.loteId))
const linhas = computed(() => relatorioPartos(dados.value, { atendimentoId: atendimentoId.value, propriedadeId: fazenda.value || undefined }, hoje()))

const nomeMes = (mes: string) => {
  const texto = new Date(`${mes}-15T12:00:00`).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })
  return texto.charAt(0).toUpperCase() + texto.slice(1)
}
const meses = computed(() => {
  const grupos = new Map<string, LinhaRelatorioParto[]>()
  for (const l of linhas.value) grupos.set(l.previsao.slice(0, 7), [...(grupos.get(l.previsao.slice(0, 7)) ?? []), l])
  return [...grupos].map(([mes, lista]) => ({ mes, nome: nomeMes(mes), lista }))
})
const confirmadas = computed(() => linhas.value.filter(l => l.situacao !== 'a-confirmar').length)
const aConfirmar = computed(() => linhas.value.filter(l => l.situacao === 'a-confirmar').length)
const variasFazendas = computed(() => new Set(linhas.value.map(l => l.fazenda)).size > 1)

const subtitulo = computed(() => {
  if (atendimento.value) {
    const fazendaNome = dados.value.propriedades.find(p => p.id === loteDoAtendimento.value?.propriedadeId)?.nome
    return [fazendaNome, loteDoAtendimento.value?.nome, `D0 ${formatarData(atendimento.value.dataD0)}`].filter(Boolean).join(' · ')
  }
  return fazenda.value ? dados.value.propriedades.find(p => p.id === fazenda.value)?.nome ?? '' : 'Todos os lotes'
})
const emitido = formatarData(hoje())
const voltarPara = computed(() => (atendimento.value ? `/atendimentos/${atendimento.value.id}` : '/'))

function imprimir() {
  window.print()
}

function baixarExcel() {
  const cabecalho = ['Vaca', 'Fazenda', 'Lote', 'Origem', 'Touro', 'Inseminação / DG', 'Previsão de parto', 'Situação']
  const corpo = linhas.value.map(l => [l.numero, l.fazenda, l.lote, l.origem, l.touro, formatarData(l.dataBase), formatarData(l.previsao), rotuloSituacaoParto[l.situacao]])
  const preambulo = [['Previsão de parto'], [subtitulo.value], [`Emitido em ${emitido}`]]
  baixarArquivo(paraCsv(cabecalho, corpo, preambulo), nomeArquivo(['Previsao de parto', subtitulo.value, dataArquivo(hoje())], 'csv'), 'text/csv;charset=utf-8')
}
</script>

<template>
  <div class="relatorio-pagina">
    <nav class="barra no-print" aria-label="Ações do relatório">
      <a :href="voltarPara" class="voltar" @click.prevent="concluirPara(voltarPara)">
        <Icone nome="voltar" />
        Voltar
      </a>
      <div class="acoes">
        <select v-if="!atendimentoId" v-model="fazenda" class="entrada entrada-compacta filtro" aria-label="Fazenda">
          <option value="">Todas as fazendas</option>
          <option v-for="p in dados.propriedades" :key="p.id" :value="p.id">{{ p.nome }}</option>
        </select>
        <button type="button" class="btn btn-contorno" :disabled="!linhas.length" @click="baixarExcel">Baixar Excel</button>
        <button type="button" class="btn btn-primario" :disabled="!linhas.length" @click="imprimir">Imprimir / salvar PDF</button>
      </div>
    </nav>

    <article class="folha">
      <header class="cabecalho">
        <div>
          <strong class="vet-nome">{{ perfil?.nome ?? '' }}</strong>
          <div class="suave">{{ [perfil?.crmv && `CRMV ${perfil.crmv}`, perfil?.empresa, perfil?.contato].filter(Boolean).join(' · ') }}</div>
        </div>
        <div class="titulo-bloco">
          <h1>Previsão de parto</h1>
          <div class="suave">{{ subtitulo }} · emitido em {{ emitido }}</div>
        </div>
      </header>

      <dl class="numeros">
        <div><dt>Partos previstos</dt><dd>{{ linhas.length }}</dd></div>
        <div><dt>Prenhez confirmada</dt><dd>{{ confirmadas }}</dd></div>
        <div><dt>A confirmar no D45</dt><dd>{{ aConfirmar }}</dd></div>
        <div><dt>Meses</dt><dd>{{ meses.length }}</dd></div>
      </dl>
      <p v-if="aConfirmar" class="aviso">
        Vacas inseminadas ainda sem DG final entram com a data prevista caso emprenhem; as vazias no D45 saem do relatório.
      </p>

      <section v-for="m in meses" :key="m.mes" class="secao mes">
        <h2>{{ m.nome }} <span>· {{ plural(m.lista.length, 'parto') }}</span></h2>
        <table class="tabela-rel">
          <thead>
            <tr>
              <th>Vaca</th>
              <th v-if="variasFazendas">Fazenda</th>
              <th v-if="!atendimentoId">Lote</th>
              <th>Touro</th>
              <th>IA / DG</th>
              <th>Previsão</th>
              <th>Situação</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="l in m.lista" :key="l.animalId">
              <td class="vaca">{{ l.numero }}</td>
              <td v-if="variasFazendas">{{ l.fazenda }}</td>
              <td v-if="!atendimentoId">{{ l.lote }}</td>
              <td>{{ l.touro || '—' }}</td>
              <td>{{ formatarData(l.dataBase) }}</td>
              <td class="previsao">{{ formatarData(l.previsao) }}</td>
              <td><span class="situacao" :class="`s-${l.situacao}`">{{ rotuloSituacaoParto[l.situacao] }}</span></td>
            </tr>
          </tbody>
        </table>
      </section>

      <div v-if="!linhas.length" class="vazio">
        Nenhum parto previsto. Entram aqui as vacas inseminadas depois do D10 e as prenhas do DG com idade gestacional.
      </div>

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
.filtro { width: auto; min-width: 180px; }
.folha {
  max-width: 900px; margin: 20px auto 0; padding: 32px; background: #FFFFFF; color: #1B2A22;
  border: 1px solid var(--borda); border-radius: var(--raio-grande); display: flex; flex-direction: column; gap: 22px;
  animation: surgir var(--medio) var(--curva);
}
.cabecalho { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; flex-wrap: wrap; padding-bottom: 16px; border-bottom: 2px solid var(--primaria); }
.vet-nome { font-size: 18px; }
.titulo-bloco { text-align: right; }
.titulo-bloco h1 { font-size: 22px; color: var(--primaria); }
.numeros { margin: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.numeros div { padding: 10px 12px; border: 1px solid var(--borda); border-radius: 10px; }
.numeros dt { font-size: 12px; font-weight: 500; color: var(--texto-suave); text-transform: uppercase; letter-spacing: .04em; }
.numeros dd { margin: 0; font-size: 22px; font-weight: 700; }
.aviso { color: var(--texto-suave); font-size: 14px; }
.secao { display: flex; flex-direction: column; gap: 8px; }
.secao h2 { font-size: 15px; font-weight: 700; color: var(--primaria); }
.secao h2 span { font-weight: 500; color: var(--texto-suave); }
.tabela-rel { width: 100%; border-collapse: collapse; font-size: 13px; }
.tabela-rel th { text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .03em; color: var(--texto-suave); padding: 6px 8px; border-bottom: 2px solid var(--borda); }
.tabela-rel td { padding: 7px 8px; border-bottom: 1px solid var(--borda-suave); }
.vaca, .previsao { font-weight: 700; }
.situacao { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 12px; font-weight: 500; white-space: nowrap; }
.s-confirmada { background: var(--primaria-suave); color: var(--primaria); }
.s-a-confirmar { background: var(--ambar-suave); color: var(--ambar-texto); }
.s-dg { background: var(--neutro-suave); color: var(--texto-2); }
.assinatura { margin-top: 28px; align-self: flex-end; width: min(320px, 100%); text-align: center; font-size: 13px; display: flex; flex-direction: column; gap: 6px; }
.linha-assinatura { border-top: 1px solid #1B2A22; height: 36px; }

@media (max-width: 719px) {
  .folha { margin: 0; border-radius: 0; border-left: 0; border-right: 0; padding: 20px 16px; }
  .titulo-bloco { text-align: left; }
  .tabela-rel { display: block; overflow-x: auto; }
}
@media print {
  @page { size: A4; margin: 14mm 12mm; }
  .no-print { display: none !important; }
  .relatorio-pagina { background: #FFFFFF; padding: 0; min-height: 0; }
  .folha { max-width: none; margin: 0; padding: 0; border: 0; border-radius: 0; gap: 16px; animation: none; }
  .tabela-rel { display: table; }
  .tabela-rel tr { break-inside: avoid; }
  .tabela-rel thead { display: table-header-group; }
  .secao h2 { break-after: avoid; }
}
</style>
