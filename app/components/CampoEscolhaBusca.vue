<script setup lang="ts">
const props = withDefaults(
  defineProps<{ rotulo: string, opcoes: string[], placeholder?: string, semResultado?: string }>(),
  { semResultado: 'Nada encontrado' },
)
const valor = defineModel<string>({ default: '' })

const id = useId()
const texto = ref(valor.value)
const aberto = ref(false)
const ativo = ref(0)
const lista = ref<HTMLElement>()
watch(valor, (v) => { texto.value = v })

// Busca sem acento e sem diferenciar maiúsculas: "charoles" acha "Charolês"
const normalizar = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()
const filtradas = computed(() => {
  const busca = normalizar(texto.value)
  if (!busca || texto.value === valor.value) return props.opcoes
  return props.opcoes.filter(o => normalizar(o).includes(busca))
})

function abrir() {
  aberto.value = true
  const i = filtradas.value.indexOf(valor.value)
  ativo.value = Math.max(i, 0)
  nextTick(rolarAteAtivo)
}

function escolher(opcao: string) {
  valor.value = opcao
  texto.value = opcao
  aberto.value = false
}

// Só vale o que está na lista; texto solto volta ao valor anterior (vazio limpa)
function confirmar() {
  aberto.value = false
  if (!texto.value.trim()) valor.value = ''
  const exata = props.opcoes.find(o => normalizar(o) === normalizar(texto.value))
  if (exata) valor.value = exata
  texto.value = valor.value
}

function digitar() {
  aberto.value = true
  ativo.value = 0
}

function mover(passo: number) {
  if (!aberto.value) return abrir()
  const total = filtradas.value.length
  if (total) ativo.value = (ativo.value + passo + total) % total
  nextTick(rolarAteAtivo)
}

function teclaEnter(e: KeyboardEvent) {
  if (!aberto.value) return
  e.preventDefault()
  const opcao = filtradas.value[ativo.value]
  if (opcao) escolher(opcao)
}

function rolarAteAtivo() {
  lista.value?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' })
}
</script>

<template>
  <div class="campo">
    <label :for="id">{{ rotulo }}</label>
    <div class="envoltorio">
      <Icone nome="busca" class="lupa" />
      <input
        :id="id"
        v-model="texto"
        class="entrada"
        role="combobox"
        :aria-expanded="aberto"
        :aria-controls="`${id}-lista`"
        :aria-activedescendant="aberto && filtradas.length ? `${id}-${ativo}` : undefined"
        aria-autocomplete="list"
        :placeholder="placeholder"
        autocomplete="off"
        @focus="abrir"
        @click="abrir"
        @input="digitar"
        @blur="confirmar"
        @keydown.down.prevent="mover(1)"
        @keydown.up.prevent="mover(-1)"
        @keydown.enter="teclaEnter"
        @keydown.esc="confirmar"
      >
      <Icone nome="avancar" class="seta" :class="{ aberta: aberto }" :tamanho="18" />
      <ul v-show="aberto" :id="`${id}-lista`" ref="lista" role="listbox" class="lista" :aria-label="rotulo">
        <li
          v-for="(opcao, i) in filtradas"
          :id="`${id}-${i}`"
          :key="opcao"
          role="option"
          :aria-selected="i === ativo"
          :class="{ ativa: i === ativo, escolhida: opcao === valor }"
          @mousedown.prevent="escolher(opcao)"
          @mousemove="ativo = i"
        >
          {{ opcao }}
          <Icone v-if="opcao === valor" nome="check" :tamanho="18" />
        </li>
        <li v-if="!filtradas.length" class="nada" role="presentation">{{ semResultado }}</li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.envoltorio { position: relative; }
.lupa { position: absolute; left: 14px; top: 50%; transform: translateY(-50%); color: var(--texto-suave); pointer-events: none; }
.seta { position: absolute; right: 14px; top: 50%; transform: translateY(-50%) rotate(90deg); color: var(--texto-suave); pointer-events: none; transition: transform .15s; }
.seta.aberta { transform: translateY(-50%) rotate(-90deg); }
.entrada { padding-left: 42px; padding-right: 40px; }
.lista {
  position: absolute; z-index: 20; top: calc(100% + 4px); left: 0; right: 0; margin: 0; padding: 6px; list-style: none;
  max-height: 264px; overflow-y: auto; overscroll-behavior: contain;
  background: var(--superficie); border: 1px solid var(--borda-campo); border-radius: var(--raio);
  box-shadow: 0 8px 24px rgb(27 42 34 / .12);
}
.lista li {
  min-height: 44px; padding: 0 12px; display: flex; align-items: center; justify-content: space-between; gap: 8px;
  border-radius: 8px; font-size: 15px; cursor: pointer;
}
.lista li.ativa { background: var(--superficie-2); }
.lista li.escolhida { color: var(--primaria); font-weight: 700; }
.lista li.nada { color: var(--texto-suave); cursor: default; }
</style>
