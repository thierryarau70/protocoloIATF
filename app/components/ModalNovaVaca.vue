<script setup lang="ts">
/**
 * Cadastro rápido de vaca sem sair do DG (modo curral). Abre como folha de baixo no celular e
 * como cartão no meio da tela no tablet e no computador. Mesmas regras do formulário completo.
 */
import type { Animal } from '#shared/types/entidades'
import { hojeNoBrasil, somarDiasData, validarCampos } from '#shared/esquemas'

const props = defineProps<{ loteId: string }>()
const emit = defineEmits<{ criada: [animal: Animal] }>()

const dialogo = ref<HTMLDialogElement>()
const fechando = ref(false)
const form = reactive({ numero: '', raca: '', nascimento: '', peso: '' })
const erros = ref<Record<string, string>>({})
const salvando = ref(false)
const ultimas = ref<string[]>([])
const ontem = computed(() => somarDiasData(hojeNoBrasil(), -1))

/** Abre o cadastro; `numero` já vem preenchido quando a vaca procurada não estava no lote */
function abrir(numero = '') {
  Object.assign(form, { numero, raca: form.raca, nascimento: '', peso: '' })
  erros.value = {}
  ultimas.value = []
  fechando.value = false
  dialogo.value?.showModal()
  nextTick(() => document.getElementById('nv-numero')?.focus())
}

function fechar() {
  if (!dialogo.value?.open || fechando.value) return
  fechando.value = true
  // Espera a animação de saída antes de fechar de verdade
  setTimeout(() => {
    dialogo.value?.close()
    fechando.value = false
  }, 260)
}

async function salvar(continuar: boolean) {
  if (salvando.value) return
  const peso = form.peso ? Number(form.peso.replace(',', '.')) : null
  const dados = {
    loteId: props.loteId,
    numero: form.numero.trim(),
    nascimento: form.nascimento || null,
    peso: Number.isFinite(peso) ? peso : null,
    raca: form.raca,
    previsaoParto: null, touroPrenhez: null,
    numPrenhezes: null, numAbortos: null, numPerdasGestacionais: null, numPartos: null, diasVazia: null, motivoDescarte: null,
  }
  erros.value = validarCampos('animal', { ...dados, id: novoId() })
  if (form.peso && !Number.isFinite(peso)) erros.value.peso = 'Peso: use só números (ex.: 450 ou 450,5).'
  if (!erros.value.numero && dados.numero && await numeroRepetido(props.loteId, dados.numero)) {
    erros.value.numero = `Já existe a vaca ${dados.numero} neste lote.`
  }
  if (Object.keys(erros.value).length) {
    await nextTick()
    dialogo.value?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
    return
  }
  salvando.value = true
  try {
    const animal = await salvarAnimal(dados) as Animal
    emit('criada', animal)
    if (continuar) {
      // Mantém a raça, que costuma ser a mesma no lote; limpa o resto para a próxima
      ultimas.value = [animal.numero, ...ultimas.value].slice(0, 5)
      Object.assign(form, { numero: '', nascimento: '', peso: '' })
      document.getElementById('nv-numero')?.focus()
    }
    else fechar()
  }
  finally {
    salvando.value = false
  }
}

defineExpose({ abrir })
</script>

<template>
  <dialog
    ref="dialogo" class="modal-vaca" :class="{ fechando }" aria-labelledby="nv-titulo"
    @cancel.prevent="fechar" @click.self="fechar"
  >
    <form class="folha" novalidate @submit.prevent="salvar(false)">
      <span class="alca" aria-hidden="true" />
      <header class="cabeca">
        <div>
          <div class="sobrelinha">Modo curral</div>
          <h2 id="nv-titulo" class="titulo">Nova vaca</h2>
        </div>
        <button type="button" class="fechar" aria-label="Fechar" @click="fechar">
          <Icone nome="fechar" :tamanho="22" />
        </button>
      </header>

      <TransitionGroup v-if="ultimas.length" tag="div" name="chip" class="ultimas" aria-live="polite">
        <span v-for="n in ultimas" :key="n" class="chip-ok"><Icone nome="check" :tamanho="14" /> {{ n }}</span>
      </TransitionGroup>

      <div class="campo">
        <label for="nv-numero">Número da vaca</label>
        <input
          id="nv-numero" v-model="form.numero" class="entrada entrada-grande" inputmode="numeric" autocomplete="off"
          placeholder="Ex.: 0487" :aria-invalid="!!erros.numero"
        >
        <p v-if="erros.numero" class="erro">{{ erros.numero }}</p>
      </div>
      <CampoEscolhaBusca v-model="form.raca" rotulo="Raça" :opcoes="racasBovinas" placeholder="Buscar raça" sem-resultado="Nenhuma raça encontrada" />
      <p v-if="erros.raca" class="erro">{{ erros.raca }}</p>
      <div class="linha-campos">
        <div class="campo">
          <label for="nv-nascimento">Nascimento</label>
          <input id="nv-nascimento" v-model="form.nascimento" class="entrada" type="date" :max="ontem" :aria-invalid="!!erros.nascimento">
        </div>
        <div class="campo">
          <label for="nv-peso">Peso (kg)</label>
          <input id="nv-peso" v-model="form.peso" class="entrada" inputmode="decimal" :aria-invalid="!!erros.peso">
        </div>
      </div>
      <p v-if="erros.nascimento" class="erro">{{ erros.nascimento }}</p>
      <p v-if="erros.peso" class="erro">{{ erros.peso }}</p>

      <div class="acoes">
        <button type="button" class="btn btn-contorno" :disabled="salvando" @click="salvar(true)">Salvar e cadastrar outra</button>
        <button type="submit" class="btn btn-primario" :disabled="salvando">Salvar e ir para o DG</button>
      </div>
    </form>
  </dialog>
</template>

<style scoped>
.modal-vaca { padding: 0; border: 0; background: transparent; max-width: none; max-height: none; width: 100%; height: 100%; margin: 0; overflow: hidden; }
.modal-vaca[open] { display: flex; align-items: center; justify-content: center; }
.modal-vaca::backdrop { background: rgba(7, 20, 15, .55); backdrop-filter: blur(3px); animation: fundo-entra .3s ease both; }
.modal-vaca.fechando::backdrop { animation: fundo-sai .26s ease both; }
@keyframes fundo-entra { from { opacity: 0; } }
@keyframes fundo-sai { to { opacity: 0; } }

.folha {
  position: relative; width: min(480px, calc(100% - 32px)); max-height: calc(100dvh - 48px); overflow-y: auto;
  display: flex; flex-direction: column; gap: 14px; padding: 24px; border-radius: 24px;
  background: var(--superficie); box-shadow: 0 30px 80px -20px rgba(7, 20, 15, .55);
  animation: cartao-entra .45s cubic-bezier(.16, 1, .3, 1) both;
}
.fechando .folha { animation: cartao-sai .26s ease-in both; }
@keyframes cartao-entra { from { opacity: 0; transform: translateY(24px) scale(.95); } }
@keyframes cartao-sai { to { opacity: 0; transform: translateY(16px) scale(.97); } }

.alca { display: none; }
.cabeca { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
.titulo { font-size: 26px; letter-spacing: -.02em; }
.fechar { width: 44px; height: 44px; margin: -8px -8px 0 0; display: grid; place-items: center; border: 0; border-radius: 50%; background: var(--neutro-suave); color: var(--texto-2); transition: transform .3s var(--curva); }
.fechar:hover { transform: rotate(90deg); }
.entrada-grande { min-height: 60px; font-size: 24px; font-weight: 700; letter-spacing: .02em; }
.acoes { display: flex; flex-direction: column-reverse; gap: 10px; margin-top: 4px; }
.acoes .btn { min-height: 52px; }

.ultimas { display: flex; flex-wrap: wrap; gap: 6px; }
.chip-ok { display: inline-flex; align-items: center; gap: 4px; padding: 4px 10px; border-radius: 999px; background: var(--primaria-suave); color: var(--primaria); font-size: 13px; font-weight: 700; }
.chip-enter-active { animation: chip-pula .45s cubic-bezier(.34, 1.56, .64, 1); }
@keyframes chip-pula { from { opacity: 0; transform: scale(.4); } }

/* Celular: folha que sobe de baixo, como num app */
@media (max-width: 599px) {
  .modal-vaca[open] { align-items: flex-end; }
  .folha { width: 100%; max-height: 92dvh; border-radius: 26px 26px 0 0; padding: 10px 20px calc(env(safe-area-inset-bottom) + 20px); animation-name: folha-sobe; }
  .fechando .folha { animation-name: folha-desce; }
  .alca { display: block; align-self: center; width: 44px; height: 5px; border-radius: 3px; background: var(--borda); margin-bottom: 4px; }
}
@keyframes folha-sobe { from { transform: translateY(100%); } }
@keyframes folha-desce { to { transform: translateY(100%); } }
@media (prefers-reduced-motion: reduce) {
  .folha, .modal-vaca::backdrop { animation-duration: 1ms !important; }
}
</style>
