<script setup lang="ts">
import { validarCampos } from '#shared/esquemas'

const props = defineProps<{ id?: string }>()

const insumo = useInsumo(() => props.id ?? '')
const form = reactive({ nome: '', unidade: 'mL', saldo: '', saldoEm: hoje(), usoPorVaca: '', minimo: '' })
watch(() => insumo.value?.id, () => {
  const i = insumo.value
  if (i) {
    Object.assign(form, {
      nome: i.nome, unidade: i.unidade, saldo: String(i.saldo), saldoEm: i.saldoEm,
      usoPorVaca: i.usoPorVaca?.toString() ?? '', minimo: i.minimo?.toString() ?? '',
    })
  }
}, { immediate: true })

const { dados } = useDadosGerais()
const situacao = computed(() => (insumo.value ? estoqueInsumo(insumo.value, dados.value.atendimentos, dados.value.linhas) : null))
// Contou de novo: a data da contagem vira hoje
watch(() => form.saldo, (v, antes) => {
  if (v !== antes && v !== (insumo.value ? String(insumo.value.saldo) : '')) form.saldoEm = hoje()
})

const numero = (v: string) => {
  const n = Number(String(v).replace(',', '.'))
  return v === '' || !Number.isFinite(n) || n < 0 ? null : n
}

function sugerir(s: typeof insumosComuns[number]) {
  Object.assign(form, { nome: s.nome, unidade: s.unidade, usoPorVaca: String(s.usoPorVaca) })
}

/** Problemas encontrados antes de salvar (mesmas regras do servidor) */
const erros = ref<string[]>([])
const checar = (dados: { id?: string }, extras: string[] = []) => {
  erros.value = [...extras, ...Object.values(validarCampos('insumo', { ...dados, id: dados.id ?? novoId() }))]
  return !erros.value.length
}

async function salvar() {
  const dados = {
    id: props.id, nome: form.nome, unidade: form.unidade,
    saldo: numero(form.saldo) ?? 0, saldoEm: form.saldoEm || hoje(),
    usoPorVaca: numero(form.usoPorVaca), minimo: numero(form.minimo),
  }
  // Texto num campo de número viraria zero ou vazio sem avisar
  const semNumero = ([valor, rotulo]: [string, string]) => (String(valor).trim() && numero(valor) === null ? `${rotulo}: use um número maior ou igual a zero (ex.: 2 ou 2,5).` : '')
  const extras = ([[form.saldo, 'Quantidade em estoque'], [form.usoPorVaca, 'Uso por vaca'], [form.minimo, 'Estoque mínimo']] as [string, string][]).map(semNumero).filter(Boolean)
  if (!checar(dados, extras)) return
  await salvarInsumo(dados)
  await concluirPara('/estoque')
}
</script>

<template>
  <AppTela :titulo="id ? 'Editar item' : 'Novo item de estoque'" sobrelinha="Estoque" :voltar="{ to: '/estoque', rotulo: 'Estoque' }">
    <form id="form-insumo" class="pilha" novalidate @submit.prevent="salvar">
      <div v-if="!id" class="pilha-curta">
        <span class="rotulo">Sugestões</span>
        <div class="sugestoes">
          <button v-for="s in insumosComuns" :key="s.nome" type="button" class="btn btn-contorno" @click="sugerir(s)">{{ s.nome }}</button>
        </div>
      </div>

      <div v-if="situacao" class="cartao-suave restante" :class="{ baixo: situacao.baixo }" role="status">
        <strong>Restam {{ situacao.restante.toLocaleString('pt-BR') }} {{ form.unidade }}</strong>
        <span>{{ situacao.usado.toLocaleString('pt-BR') }} {{ form.unidade }} usados desde {{ formatarData(insumo?.saldoEm) }}<template v-if="situacao.baixo"> · repor</template></span>
      </div>

      <div class="campo">
        <label for="nome">Produto</label>
        <input id="nome" v-model="form.nome" class="entrada" placeholder="Ex.: Benzoato de estradiol" autocomplete="off" required>
      </div>
      <div class="linha-campos">
        <div class="campo">
          <label for="saldo">Quantidade contada</label>
          <input id="saldo" v-model="form.saldo" class="entrada" inputmode="decimal" required>
        </div>
        <div class="campo">
          <label for="unidade">Unidade</label>
          <input id="unidade" v-model="form.unidade" class="entrada" placeholder="mL, unidades…" required>
        </div>
      </div>
      <div class="campo">
        <label for="saldo-em">Contada em</label>
        <input id="saldo-em" v-model="form.saldoEm" class="entrada" type="date" required>
      </div>
      <div class="linha-campos">
        <div class="campo">
          <label for="uso">Gasto por vaca no protocolo</label>
          <input id="uso" v-model="form.usoPorVaca" class="entrada" inputmode="decimal" placeholder="Ex.: 2">
        </div>
        <div class="campo">
          <label for="minimo">Avisar quando restar</label>
          <input id="minimo" v-model="form.minimo" class="entrada" inputmode="decimal">
        </div>
      </div>
      <p class="dica">
        Cada vaca que entra no protocolo IATF (vazia apta no DG) desconta o gasto por vaca, a partir da data da contagem.
        Deixe o gasto em branco para itens que você não quer descontar automaticamente.
      </p>
      <ul v-if="erros.length" class="erro lista-erros" role="alert">
        <li v-for="e in erros" :key="e">{{ e }}</li>
      </ul>
    </form>
    <template #rodape>
      <button type="submit" form="form-insumo" class="btn btn-primario btn-bloco">Salvar</button>
    </template>
  </AppTela>
</template>

<style scoped>
.sugestoes { display: flex; flex-wrap: wrap; gap: 6px; }
.sugestoes .btn { min-height: 40px; padding: 0 12px; font-size: 13px; }
.restante { display: flex; flex-direction: column; gap: 2px; }
.restante strong { font-size: 18px; }
.restante.baixo { background: var(--ambar-suave); color: var(--ambar-texto); }
</style>
