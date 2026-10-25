<script setup lang="ts">
const props = defineProps<{ propriedadeId: string, id?: string }>()

const route = useRoute()
const semen = useSemen(() => props.id ?? '')
const { propriedade } = usePropriedade(() => props.propriedadeId)
const form = reactive({ nome: '', raca: '', partida: '', estoqueDoses: '', estoqueEm: '', estoqueMinimo: '' })
watch(() => semen.value?.id, () => {
  const s = semen.value
  if (s) {
    Object.assign(form, {
      nome: s.nome, raca: s.raca ?? '', partida: s.partida ?? '',
      estoqueDoses: s.estoqueDoses?.toString() ?? '', estoqueEm: s.estoqueEm ?? '', estoqueMinimo: s.estoqueMinimo?.toString() ?? '',
    })
  }
}, { immediate: true })

// Doses restantes: as contadas menos as inseminações com este sêmen desde a contagem
const { dados } = useDadosGerais()
const estoque = computed(() => (semen.value ? estoqueSemen(semen.value, dados.value.atendimentos, dados.value.linhas) : null))
// Contou de novo: a data da contagem vira hoje
watch(() => form.estoqueDoses, (v, antes) => {
  if (v !== antes && v !== (semen.value?.estoqueDoses?.toString() ?? '')) form.estoqueEm = hoje()
})

// Vindo da planilha, volta para ela depois de salvar (só caminhos internos)
const voltar = computed(() => {
  const v = String(route.query.voltar ?? '')
  return v.startsWith('/') && !v.startsWith('//') ? v : `/propriedades/${props.propriedadeId}`
})

async function salvar() {
  const doses = inteiroOuNulo(form.estoqueDoses)
  await salvarSemen({
    id: props.id, propriedadeId: props.propriedadeId, nome: form.nome, raca: form.raca, partida: form.partida,
    estoqueDoses: doses,
    estoqueEm: doses === null ? null : form.estoqueEm || hoje(),
    estoqueMinimo: doses === null ? null : inteiroOuNulo(form.estoqueMinimo),
  })
  await concluirPara(voltar.value)
}
</script>

<template>
  <AppTela :titulo="id ? 'Editar sêmen' : 'Novo sêmen'" :sobrelinha="propriedade?.nome" :voltar="{ to: voltar, rotulo: 'Voltar' }">
    <form id="form-semen" class="pilha" @submit.prevent="salvar">
      <div class="campo">
        <label for="nome">Touro</label>
        <input id="nome" v-model="form.nome" class="entrada" placeholder="Nome do touro" autocapitalize="words" autocomplete="off" required>
      </div>
      <CampoEscolhaBusca v-model="form.raca" rotulo="Raça" :opcoes="racasBovinas" placeholder="Buscar raça" sem-resultado="Nenhuma raça encontrada" />
      <div class="campo">
        <label for="partida">Central / partida</label>
        <input id="partida" v-model="form.partida" class="entrada" placeholder="Ex.: ABS 123" autocomplete="off">
      </div>
      <p class="dica">Os sêmens cadastrados aqui aparecem na planilha IATF desta fazenda para escolher em cada vaca inseminada.</p>

      <fieldset class="estoque">
        <legend class="titulo-secao">Estoque (opcional)</legend>
        <div v-if="estoque" class="cartao-suave restante" :class="{ baixo: estoque.baixo }" role="status">
          <strong>Restam {{ plural(estoque.restante, 'dose') }}</strong>
          <span>{{ plural(estoque.usado, 'inseminação', 'inseminações') }} desde {{ formatarData(semen?.estoqueEm) }}<template v-if="estoque.baixo"> · repor</template></span>
        </div>
        <div class="linha-campos">
          <div class="campo">
            <label for="doses">Doses contadas</label>
            <input id="doses" v-model="form.estoqueDoses" class="entrada" type="number" min="0" step="1" inputmode="numeric">
          </div>
          <div class="campo">
            <label for="contadas-em">Contadas em</label>
            <input id="contadas-em" v-model="form.estoqueEm" class="entrada" type="date" :disabled="!form.estoqueDoses">
          </div>
        </div>
        <div class="campo">
          <label for="minimo">Avisar quando restar (doses)</label>
          <input id="minimo" v-model="form.estoqueMinimo" class="entrada" type="number" min="0" step="1" inputmode="numeric" :disabled="!form.estoqueDoses">
        </div>
        <p class="dica">Cada inseminação com este sêmen na planilha desconta uma dose. Ao contar de novo, troque as doses: a data vira hoje.</p>
      </fieldset>
    </form>
    <template #rodape>
      <button type="submit" form="form-semen" class="btn btn-primario btn-bloco">Salvar sêmen</button>
    </template>
  </AppTela>
</template>

<style scoped>
.estoque { margin: 8px 0 0; padding: 0; border: 0; display: flex; flex-direction: column; gap: 14px; }
.estoque legend { padding: 0; margin-bottom: 14px; }
.restante { display: flex; flex-direction: column; gap: 2px; }
.restante strong { font-size: 18px; }
.restante.baixo { background: var(--ambar-suave); color: var(--ambar-texto); }
</style>
