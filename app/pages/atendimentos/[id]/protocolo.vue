<script setup lang="ts">
const route = useRoute()
const id = () => String(route.params.id)
const { atendimento, lote, propriedade, contagem, atualizar } = useAtendimento(id)

const form = reactive({ gnrh: null as boolean | null, horaD8: '', horaD10: '' })
// Preenche uma vez por atendimento; a sincronização em segundo plano não apaga o que está sendo digitado
watch(() => atendimento.value?.id, () => {
  const a = atendimento.value
  if (a) Object.assign(form, { gnrh: a.gnrh, horaD8: a.horaD8?.slice(0, 5) ?? '', horaD10: a.horaD10?.slice(0, 5) ?? '' })
}, { immediate: true })

const dataCalculada = (data?: string) => (data ? formatarData(data) : 'Calculada ao sincronizar')

async function salvar() {
  await atualizar({ status: 'protocolo', gnrh: form.gnrh, horaD8: form.horaD8 || null, horaD10: form.horaD10 || null })
  await navigateTo(`/atendimentos/${id()}`)
}
</script>

<template>
  <div>
    <!-- Raiz sempre presente: com v-if na raiz a transição entre telas trava -->
    <AppTela
      v-if="atendimento"
      titulo="Protocolo IATF"
      :sobrelinha="`${propriedade?.nome ?? ''} · ${lote?.nome ?? ''} · ${plural(contagem.vazia, 'vaca apta', 'vacas aptas')}`"
      :voltar="{ to: `/atendimentos/${atendimento.id}/dg`, rotulo: 'DG' }"
    >
      <template #topo>
        <EtapasFluxo :atual="4" />
      </template>

      <form id="form-protocolo" class="pilha-curta" @submit.prevent="salvar">
        <fieldset class="cartao gnrh">
          <legend>Usa GnRH?</legend>
          <span>GnRH no protocolo</span>
          <GrupoEscolha v-model="form.gnrh" rotulo="Usa GnRH" :opcoes="[{ valor: true, rotulo: 'Sim' }, { valor: false, rotulo: 'Não', tom: 'neutro' }]" />
        </fieldset>

        <div class="cartao etapa cartao-destaque">
          <span class="dia dia-forte">D0</span>
          <div class="texto">
            <div class="nome">Ultrassom + implante</div>
            <div class="suave">{{ formatarData(atendimento.dataD0) }}</div>
          </div>
        </div>
        <div class="cartao etapa">
          <span class="dia">D8</span>
          <div class="texto">
            <div class="nome">Retirada do implante + hormônio</div>
            <div class="suave">{{ dataCalculada(atendimento.dataD8) }} · pode ser D7 a D9</div>
          </div>
          <div class="campo hora">
            <label for="h8">Hora início</label>
            <input id="h8" v-model="form.horaD8" type="time" class="entrada entrada-compacta">
          </div>
        </div>
        <div class="cartao etapa">
          <span class="dia">D10</span>
          <div class="texto">
            <div class="nome">Inseminação</div>
            <div class="suave">{{ dataCalculada(atendimento.dataD10) }}</div>
          </div>
          <div class="campo hora">
            <label for="h10">Hora início</label>
            <input id="h10" v-model="form.horaD10" type="time" class="entrada entrada-compacta">
          </div>
        </div>
        <div class="cartao etapa futura">
          <span class="dia dia-neutro">D45</span>
          <div class="texto">
            <div class="nome">DG final</div>
            <div class="suave">{{ dataCalculada(atendimento.dataD45) }} · confirma quem emprenhou</div>
          </div>
        </div>
      </form>

      <template #rodape>
        <button type="submit" form="form-protocolo" class="btn btn-primario btn-bloco">Salvar protocolo</button>
      </template>
    </AppTela>
  </div>
</template>

<style scoped>
.gnrh { margin: 0; display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 16px; }
.gnrh legend { padding: 0 6px; font-size: 13px; font-weight: 500; color: var(--texto-suave); }
.gnrh > span { font-size: 15px; font-weight: 500; }
.etapa { display: flex; align-items: center; gap: 12px; padding: 14px 16px; flex-wrap: wrap; }
.futura { background: var(--superficie-2); border-style: dashed; border-color: #AFBDB2; }
.dia { width: 48px; height: 48px; flex: none; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: var(--primaria-suave); color: var(--primaria); font-size: 16px; font-weight: 700; }
.dia-forte { background: var(--primaria); color: #FFFFFF; }
.dia-neutro { background: var(--neutro-suave); color: var(--texto-2); }
.texto { flex: 1; min-width: 150px; display: flex; flex-direction: column; gap: 2px; }
.nome { font-size: 16px; font-weight: 700; }
.hora { width: 132px; }
.hora label { font-size: 12px; }
</style>
