<script setup lang="ts">
/**
 * DG no curral: uma vaca por vez, botões grandes e alto contraste para o sol.
 * Marcou, passa sozinho para a próxima pendente. Dá para ir até a vaca pelo número, pela voz
 * ("doze prenha sessenta dias") ou pela foto do brinco.
 */
import type { AtendimentoAnimal, SituacaoDg } from '#shared/types/entidades'
import type { VacaNoAtendimento } from '~/composables/useAtendimento'

const props = defineProps<{ vacas: VacaNoAtendimento[] }>()
const emit = defineEmits<{ linha: [vaca: VacaNoAtendimento, campos: Partial<AtendimentoAnimal>] }>()

const situacaoDe = (v: VacaNoAtendimento): SituacaoDg => v.linha?.situacaoDg ?? 'pendente'
const atualId = ref<string>()
const atual = computed(() => props.vacas.find(v => v.animal.id === atualId.value) ?? props.vacas[0])
const indice = computed(() => (atual.value ? props.vacas.indexOf(atual.value) : -1))
const pendentes = computed(() => props.vacas.filter(v => situacaoDe(v) === 'pendente').length)
const numeros = computed(() => props.vacas.map(v => v.animal.numero))
const situacao = computed(() => (atual.value ? situacaoDe(atual.value) : 'pendente'))

// Começa na primeira pendente
watch(() => props.vacas.length, () => {
  if (!atualId.value) atualId.value = (props.vacas.find(v => situacaoDe(v) === 'pendente') ?? props.vacas[0])?.animal.id
}, { immediate: true })

const aviso = ref('')
let temporizador: ReturnType<typeof setTimeout> | undefined
onBeforeUnmount(() => clearTimeout(temporizador))

function irPara(v: VacaNoAtendimento | undefined) {
  clearTimeout(temporizador)
  if (v) atualId.value = v.animal.id
}

/** Próxima pendente depois da atual (dá a volta no lote); se não houver, a vaca seguinte. */
function proximaPendente(depoisDe: number) {
  const n = props.vacas.length
  for (let i = 1; i <= n; i++) {
    const v = props.vacas[(depoisDe + i) % n]!
    if (situacaoDe(v) === 'pendente') return v
  }
  return undefined
}

function avancarDepois(vaca: VacaNoAtendimento) {
  clearTimeout(temporizador)
  temporizador = setTimeout(() => {
    const seguinte = proximaPendente(props.vacas.indexOf(vaca))
    if (seguinte) atualId.value = seguinte.animal.id
    else aviso.value = 'Todas as vacas do lote foram avaliadas.'
  }, 700)
}

function marcar(valor: Exclude<SituacaoDg, 'pendente'>, vaca = atual.value, idade?: string) {
  if (!vaca) return
  emit('linha', vaca, idade ? { situacaoDg: valor, idadeGestacional: idade } : { situacaoDg: valor })
  aviso.value = `Vaca ${vaca.animal.numero}: ${rotuloSituacao[valor]}${idade ? `, ${idade}` : ''}`
  // Prenha sem idade espera a idade gestacional (ou "Próxima"); o resto avança sozinho
  if (valor !== 'prenha' || idade) avancarDepois(vaca)
}

function idade(texto: string) {
  if (atual.value) marcar('prenha', atual.value, texto)
}

const busca = ref('')
function buscar() {
  const achado = acharNumero(busca.value.trim(), numeros.value)
  aviso.value = achado ? '' : `A vaca ${busca.value} não está neste lote.`
  irPara(props.vacas.find(v => v.animal.numero === achado))
  busca.value = ''
}

function achouPorFoto(numero: string) {
  irPara(props.vacas.find(v => v.animal.numero === numero))
  aviso.value = `Brinco lido: vaca ${numero}`
}

const ouvido = ref('')
const fala = useFala((texto) => {
  ouvido.value = texto
  const c = interpretarFala(texto)
  let vaca = atual.value
  if (c.numero) {
    const achado = acharNumero(c.numero, numeros.value)
    if (!achado) {
      aviso.value = `Ouvi a vaca ${c.numero}, mas ela não está neste lote.`
      return
    }
    vaca = props.vacas.find(v => v.animal.numero === achado)
    irPara(vaca)
  }
  if (c.situacao) marcar(c.situacao, vaca, c.situacao === 'prenha' ? c.idadeGestacional : undefined)
  else if (c.idadeGestacional && vaca && situacaoDe(vaca) === 'prenha') marcar('prenha', vaca, c.idadeGestacional)
  else if (!c.numero) aviso.value = 'Não entendi. Ex.: "doze prenha sessenta dias".'
})

const idades = ['30 dias', '45 dias', '60 dias', '90 dias', '120 dias']
const tons: Record<Exclude<SituacaoDg, 'pendente'>, string> = { prenha: 'verde', vazia: 'ambar', descarte: 'vermelho', refugo: 'neutro' }
</script>

<template>
  <div class="curral">
    <div class="barra-topo">
      <span class="progresso">{{ indice + 1 }} de {{ vacas.length }} · {{ plural(pendentes, 'pendente') }}</span>
      <form class="ir" @submit.prevent="buscar">
        <label for="curral-ir" class="sr-only">Ir para a vaca número</label>
        <input id="curral-ir" v-model="busca" class="entrada" inputmode="numeric" placeholder="Nº da vaca" autocomplete="off">
        <button type="submit" class="btn btn-contorno" :disabled="!busca">Ir</button>
      </form>
    </div>

    <section v-if="atual" class="cartao vaca" :aria-label="`Vaca ${atual.animal.numero}`">
      <div class="cabeca">
        <button type="button" class="seta" aria-label="Vaca anterior" :disabled="indice <= 0" @click="irPara(vacas[indice - 1])">
          <Icone nome="voltar" :tamanho="28" />
        </button>
        <div class="numero-bloco">
          <span class="rotulo">Vaca</span>
          <Transition name="troca" mode="out-in">
            <strong :key="atual.animal.id" class="numero">{{ atual.animal.numero }}</strong>
          </Transition>
          <span v-if="situacao !== 'pendente'" class="selo" :class="`tom-${tomSituacao[situacao]}`">{{ rotuloSituacao[situacao] }}</span>
        </div>
        <button type="button" class="seta" aria-label="Próxima vaca" :disabled="indice >= vacas.length - 1" @click="irPara(vacas[indice + 1])">
          <Icone nome="avancar" :tamanho="28" />
        </button>
      </div>

      <div class="botoes" role="group" :aria-label="`Situação da vaca ${atual.animal.numero}`">
        <button
          v-for="o in situacoesDg" :key="o.valor" type="button" class="escolha" :class="[`tom-${tons[o.valor]}`, { ativa: situacao === o.valor }]"
          :aria-pressed="situacao === o.valor" @click="marcar(o.valor)"
        >
          {{ o.rotulo }}
        </button>
      </div>

      <div v-if="situacao === 'prenha'" class="idade">
        <span class="rotulo">Idade gestacional</span>
        <div class="chips">
          <button
            v-for="i in idades" :key="i" type="button" class="btn" :class="atual.linha?.idadeGestacional === i ? 'btn-primario' : 'btn-contorno'"
            @click="idade(i)"
          >
            {{ i }}
          </button>
        </div>
        <button type="button" class="btn btn-bloco" @click="irPara(proximaPendente(indice))">Próxima vaca</button>
      </div>
    </section>

    <p v-if="aviso" class="aviso" role="status" aria-live="polite">{{ aviso }}</p>

    <div class="ferramentas">
      <div v-if="fala.suportado" class="microfone">
        <button type="button" class="btn btn-bloco" :class="fala.ouvindo.value ? 'btn-primario ouvindo' : 'btn-contorno'" :aria-pressed="fala.ouvindo.value" @click="fala.alternar">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
          {{ fala.ouvindo.value ? 'Ouvindo… toque para parar' : 'Ditar' }}
        </button>
        <p v-if="ouvido" class="dica">Ouvi: “{{ ouvido }}”</p>
        <p v-else-if="!fala.ouvindo.value" class="dica">Fale o número e a situação: “doze prenha sessenta dias”.</p>
        <p v-if="fala.erro.value" class="erro">{{ fala.erro.value }}</p>
      </div>
      <LeitorBrinco :numeros="numeros" @achou="achouPorFoto" />
    </div>
  </div>
</template>

<style scoped>
/* Alto contraste: texto mais escuro, bordas mais fortes e letras maiores para ler no sol */
.curral { --texto: #000000; --texto-suave: #2A3A30; --borda: #6E7F73; display: flex; flex-direction: column; gap: 14px; }
.barra-topo { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
.progresso { font-size: 16px; font-weight: 700; }
.ir { display: flex; gap: 6px; }
.ir .entrada { width: 140px; }
.vaca { display: flex; flex-direction: column; gap: 16px; border-width: 2px; }
.cabeca { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.seta { width: 56px; height: 56px; border-radius: 50%; border: 2px solid var(--borda); background: var(--superficie); color: var(--texto); display: flex; align-items: center; justify-content: center; }
.seta:disabled { opacity: .3; }
.numero-bloco { flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; }
.rotulo { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: .06em; color: var(--texto-suave); }
.numero { font-size: 56px; line-height: 1; font-weight: 700; letter-spacing: -.02em; }
.botoes { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.escolha {
  min-height: 88px; border-radius: 16px; border: 3px solid var(--borda); background: var(--superficie); color: var(--texto);
  font-size: 22px; font-weight: 700; transition: background-color var(--rapido), color var(--rapido), transform var(--rapido) var(--curva);
}
.escolha:active { transform: scale(.96); }
.escolha.ativa { color: #FFFFFF; animation: marcar var(--medio) var(--curva); }
.escolha.ativa.tom-verde { background: var(--primaria); border-color: var(--primaria); }
.escolha.ativa.tom-ambar { background: var(--ambar); border-color: var(--ambar); }
.escolha.ativa.tom-vermelho { background: var(--vermelho); border-color: var(--vermelho); }
.escolha.ativa.tom-neutro { background: var(--neutro); border-color: var(--neutro); }
.idade { display: flex; flex-direction: column; gap: 10px; }
.chips { display: flex; flex-wrap: wrap; gap: 8px; }
.chips .btn { flex: 1; min-width: 92px; min-height: 52px; font-size: 16px; }
.aviso { font-size: 16px; font-weight: 700; text-align: center; animation: surgir var(--medio) var(--curva); }
.ferramentas { display: grid; gap: 14px; }
.microfone { display: flex; flex-direction: column; gap: 6px; }
.ouvindo { animation: pulsar 1.4s ease-in-out infinite; }
@keyframes pulsar { 50% { box-shadow: 0 0 0 8px var(--primaria-suave); } }
.troca-enter-active { animation: surgir var(--rapido) var(--curva); }
.troca-leave-active { transition: opacity 80ms; }
.troca-leave-to { opacity: 0; }

@media (min-width: 720px) {
  .botoes { grid-template-columns: repeat(4, 1fr); }
  .ferramentas { grid-template-columns: 1fr 1fr; align-items: start; }
}
</style>
