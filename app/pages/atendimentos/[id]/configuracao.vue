<script setup lang="ts">
/**
 * Configuração IATF do lote: vale para todas as vacas do protocolo e vem antes da planilha.
 * O dia do hormônio escolhido aqui preenche a planilha das vacas que ainda não têm dia anotado.
 */
import { somarDiasData } from '#shared/esquemas'

type Dia = 'd7' | 'd8' | 'd9'
const route = useRoute()
const id = () => String(route.params.id)
const { atendimento, lote, propriedade, vacas, atualizar, atualizarVaca } = useAtendimento(id)

/** Touro do lote: id do sêmen, ou 'varios' quando cada vaca recebe um touro escolhido na planilha */
type Touro = string | 'varios'
const form = reactive({ vacinaReprodutiva: null as boolean | null, diaHormonio: null as Dia | null, gnrh: null as boolean | null, touro: null as Touro | null })
const touroDe = (a: { semenId: string | null, variosTouros: boolean | null }): Touro | null => (a.variosTouros ? 'varios' : a.semenId)
const completa = (a: { vacinaReprodutiva: boolean | null, diaHormonio: string | null, gnrh: boolean | null, semenId: string | null, variosTouros: boolean | null }) =>
  a.vacinaReprodutiva !== null && a.diaHormonio !== null && a.gnrh !== null && touroDe(a) !== null

/**
 * Em vez de responder tudo de novo a cada lote, a tela já vem com a configuração do último lote
 * configurado e só pede confirmação ("Sim, abrir a planilha" ou "Não, alterar").
 * Vindo do "Alterar" da planilha (lote já configurado), abre direto para editar.
 * O touro do último lote só é sugerido se o sêmen for desta fazenda.
 */
const confirmando = ref(false)
watch(() => atendimento.value?.id, async () => {
  const a = atendimento.value
  if (!a) return
  Object.assign(form, { vacinaReprodutiva: a.vacinaReprodutiva, diaHormonio: a.diaHormonio, gnrh: a.gnrh, touro: touroDe(a) })
  if (completa(a)) return
  const anteriores = await bancoLocal.atendimentos.filter(o => o.id !== a.id && completa(o)).toArray()
  const ultimo = anteriores.sort((x, y) => y.dataD0.localeCompare(x.dataD0))[0]
  if (!ultimo) return
  let touro = touroDe(ultimo)
  if (touro && touro !== 'varios') {
    const [s, l] = await Promise.all([bancoLocal.semens.get(touro), bancoLocal.lotes.get(a.loteId)])
    if (!s || s.propriedadeId !== l?.propriedadeId) touro = null
  }
  Object.assign(form, {
    vacinaReprodutiva: a.vacinaReprodutiva ?? ultimo.vacinaReprodutiva,
    diaHormonio: a.diaHormonio ?? ultimo.diaHormonio,
    gnrh: a.gnrh ?? ultimo.gnrh,
    touro: touroDe(a) ?? touro,
  })
  // Sem touro desta fazenda para sugerir, a pergunta do touro precisa ser respondida
  confirmando.value = form.touro !== null
}, { immediate: true })

const { semens } = useSemens(() => propriedade.value?.id)
const nomeTouro = (t: Touro | null) => (t === 'varios' ? 'Mais de um touro' : semens.value.find(s => s.id === t)?.nome ?? '—')
const resumo = computed(() => [
  { rotulo: 'Vacina reprodutiva', valor: form.vacinaReprodutiva ? 'Sim' : 'Não' },
  { rotulo: 'Retirada do implante + hormônio', valor: form.diaHormonio?.toUpperCase() ?? '—' },
  { rotulo: 'GnRH na inseminação', valor: form.gnrh ? 'Sim' : 'Não' },
  { rotulo: 'Touro da inseminação', valor: nomeTouro(form.touro) },
])
const cadastrarSemen = computed(() => `/propriedades/${propriedade.value?.id}/semen/novo?voltar=${encodeURIComponent(route.path)}`)

const emProtocolo = computed(() => vacas.value.filter(v => v.linha?.emProtocolo))
const simNao = [{ valor: true, rotulo: 'Sim' }, { valor: false, rotulo: 'Não', tom: 'neutro' as const }]
const dias = computed(() => (['d7', 'd8', 'd9'] as const).map((d, i) => ({
  valor: d,
  rotulo: d.toUpperCase(),
  data: atendimento.value ? formatarData(somarDiasData(atendimento.value.dataD0, 7 + i)) : '',
})))
const faltam = computed(() => [
  form.vacinaReprodutiva === null && 'vacina reprodutiva',
  form.diaHormonio === null && 'dia do hormônio',
  form.gnrh === null && 'GnRH na inseminação',
  form.touro === null && 'touro da inseminação',
].filter(Boolean) as string[])
const tentou = ref(false)
const salvando = ref(false)

async function salvar() {
  tentou.value = true
  const a = atendimento.value
  if (!a || faltam.value.length || salvando.value) return
  salvando.value = true
  try {
    const diaAnterior = a.diaHormonio
    const varios = form.touro === 'varios'
    await atualizar({
      vacinaReprodutiva: form.vacinaReprodutiva, diaHormonio: form.diaHormonio, gnrh: form.gnrh,
      semenId: varios ? null : form.touro, variosTouros: varios,
    })
    // Leva o dia do lote às vacas sem dia anotado (ou que seguiam o dia antigo do lote).
    // O touro entra em cada vaca quando ela é marcada como inseminada (LinhaPlanilha).
    for (const v of emProtocolo.value) {
      const atual = v.linha?.hormonioDia ?? null
      if (atual === null || atual === diaAnterior) await atualizarVaca(v, { hormonioDia: form.diaHormonio })
    }
    // Troca esta tela pela planilha: o Voltar da planilha leva ao atendimento
    await navigateTo(`/atendimentos/${a.id}/planilha`, { replace: true })
  }
  finally {
    salvando.value = false
  }
}
</script>

<template>
  <div>
    <!-- Raiz sempre presente: com v-if na raiz a transição entre telas trava -->
    <AppTela
      v-if="atendimento"
      titulo="Configuração IATF do lote"
      :sobrelinha="`${propriedade?.nome ?? ''} · ${lote?.nome ?? ''} · ${plural(emProtocolo.length, 'vaca apta', 'vacas aptas')}`"
      :voltar="{ to: `/atendimentos/${atendimento.id}`, rotulo: lote?.nome ?? 'Lote' }"
    >
      <div v-if="confirmando" class="pilha confirmar">
        <p class="pergunta-confirmar">A configuração deste lote é a mesma do último?</p>
        <ul class="cartao resumo">
          <li v-for="(r, i) in resumo" :key="r.rotulo" :style="{ '--ordem': i }">
            <span>{{ r.rotulo }}</span>
            <strong>{{ r.valor }}</strong>
          </li>
        </ul>
      </div>

      <form v-else id="form-config" class="pilha" @submit.prevent="salvar">
        <p class="dica">Vale para todas as vacas do protocolo. Depois de salvar, abre a planilha IATF.</p>

        <fieldset class="cartao pergunta" :class="{ faltando: tentou && form.vacinaReprodutiva === null }" style="--ordem: 0">
          <legend class="sr-only">Vacina reprodutiva</legend>
          <div class="enunciado">
            <span class="numero-pergunta">1</span>
            <div>
              <div class="titulo-pergunta">Vacina reprodutiva</div>
              <div class="suave">O lote recebeu vacina reprodutiva?</div>
            </div>
          </div>
          <GrupoEscolha v-model="form.vacinaReprodutiva" rotulo="Vacina reprodutiva" :opcoes="simNao" />
        </fieldset>

        <fieldset class="cartao pergunta" :class="{ faltando: tentou && form.diaHormonio === null }" style="--ordem: 1">
          <legend class="sr-only">Dia do hormônio</legend>
          <div class="enunciado">
            <span class="numero-pergunta">2</span>
            <div>
              <div class="titulo-pergunta">Retirada do implante + hormônio</div>
              <div class="suave">Em que dia do protocolo?</div>
            </div>
          </div>
          <div class="dias" role="group" aria-label="Dia do hormônio">
            <button
              v-for="d in dias" :key="d.valor" type="button" class="dia-opcao" :class="{ ativa: form.diaHormonio === d.valor }"
              :aria-pressed="form.diaHormonio === d.valor" @click="form.diaHormonio = d.valor"
            >
              <strong>{{ d.rotulo }}</strong>
              <span>{{ d.data }}</span>
            </button>
          </div>
        </fieldset>

        <fieldset class="cartao pergunta" :class="{ faltando: tentou && form.gnrh === null }" style="--ordem: 2">
          <legend class="sr-only">GnRH na inseminação</legend>
          <div class="enunciado">
            <span class="numero-pergunta">3</span>
            <div>
              <div class="titulo-pergunta">GnRH na inseminação</div>
              <div class="suave">Aplica GnRH na inseminação artificial?</div>
            </div>
          </div>
          <GrupoEscolha v-model="form.gnrh" rotulo="GnRH na inseminação" :opcoes="simNao" />
        </fieldset>

        <fieldset class="cartao pergunta" :class="{ faltando: tentou && form.touro === null }" style="--ordem: 3">
          <legend class="sr-only">Touro da inseminação</legend>
          <div class="enunciado">
            <span class="numero-pergunta">4</span>
            <div>
              <div class="titulo-pergunta">Touro da inseminação</div>
              <div class="suave">Vai para cada vaca inseminada; dá para trocar vaca a vaca na planilha.</div>
            </div>
          </div>
          <div class="touros" role="group" aria-label="Touro da inseminação">
            <button
              v-for="s in semens" :key="s.id" type="button" class="touro-opcao" :class="{ ativa: form.touro === s.id }"
              :aria-pressed="form.touro === s.id" @click="form.touro = s.id"
            >
              {{ s.nome }}
            </button>
            <button type="button" class="touro-opcao varios" :class="{ ativa: form.touro === 'varios' }" :aria-pressed="form.touro === 'varios'" @click="form.touro = 'varios'">
              Mais de um touro
              <span>escolher vaca a vaca na planilha</span>
            </button>
          </div>
          <NuxtLink :to="cadastrarSemen" class="btn btn-tracejado">+ Cadastrar sêmen da fazenda</NuxtLink>
        </fieldset>

        <p v-if="tentou && faltam.length" class="erro" role="alert">Falta responder: {{ faltam.join(', ') }}.</p>
      </form>

      <template #rodape>
        <div v-if="confirmando" class="acoes-confirmar">
          <button type="button" class="btn btn-contorno" @click="confirmando = false">Não, alterar</button>
          <button type="button" class="btn btn-primario" :disabled="salvando" @click="salvar">
            Sim, abrir a planilha
            <Icone nome="avancar" :tamanho="18" />
          </button>
        </div>
        <button v-else type="submit" form="form-config" class="btn btn-primario btn-bloco" :disabled="salvando">
          Salvar e abrir a planilha IATF
          <Icone nome="avancar" :tamanho="18" />
        </button>
      </template>
    </AppTela>
  </div>
</template>

<style scoped>
.touros { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
.touro-opcao {
  min-height: 56px; padding: 8px 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  border: 2px solid var(--borda-campo); border-radius: var(--raio); background: var(--superficie); color: var(--texto); font-size: 15px; font-weight: 700;
  transition: background-color var(--rapido), border-color var(--rapido), color var(--rapido), transform var(--rapido) var(--curva);
}
.touro-opcao span { font-size: 11px; font-weight: 400; color: var(--texto-suave); }
.touro-opcao:active { transform: scale(.96); }
.touro-opcao.ativa { background: var(--primaria); border-color: var(--primaria); color: #FFFFFF; animation: marcar var(--medio) var(--curva); }
.touro-opcao.ativa span { color: rgba(255, 255, 255, .85); }
.pergunta-confirmar { font-size: 18px; font-weight: 700; }
.resumo { list-style: none; margin: 0; padding: 4px 16px; }
.resumo li { display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 56px; border-bottom: 1px solid var(--borda-suave); animation: surgir var(--medio) var(--curva) calc(var(--ordem) * 80ms) backwards; }
.resumo li:last-child { border-bottom: 0; }
.resumo strong { font-size: 18px; color: var(--primaria); }
.acoes-confirmar { display: flex; gap: 10px; }
.acoes-confirmar .btn { flex: 1; white-space: nowrap; padding-left: 10px; padding-right: 10px; }
.acoes-confirmar .btn-primario { flex: 2; }
.pergunta {
  margin: 0; display: flex; flex-direction: column; gap: 14px; padding: 18px 16px;
  animation: surgir var(--medio) var(--curva) calc(var(--ordem) * 80ms) backwards;
  transition: border-color var(--rapido), box-shadow var(--rapido);
}
.pergunta.faltando { border-color: var(--vermelho-borda); box-shadow: 0 0 0 3px var(--vermelho-suave); }
.enunciado { display: flex; align-items: flex-start; gap: 12px; }
.numero-pergunta { width: 32px; height: 32px; flex: none; display: grid; place-items: center; border-radius: 50%; background: var(--primaria-suave); color: var(--primaria); font-weight: 700; }
.titulo-pergunta { font-size: 17px; font-weight: 700; }
.dias { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; }
.dia-opcao {
  min-height: 72px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 2px;
  border: 2px solid var(--borda-campo); border-radius: var(--raio); background: var(--superficie); color: var(--texto);
  transition: background-color var(--rapido), border-color var(--rapido), color var(--rapido), transform var(--rapido) var(--curva);
}
.dia-opcao strong { font-size: 22px; }
.dia-opcao span { font-size: 12px; color: var(--texto-suave); }
.dia-opcao:active { transform: scale(.96); }
.dia-opcao.ativa { background: var(--primaria); border-color: var(--primaria); color: #FFFFFF; animation: marcar var(--medio) var(--curva); }
.dia-opcao.ativa span { color: rgba(255, 255, 255, .85); }
</style>
