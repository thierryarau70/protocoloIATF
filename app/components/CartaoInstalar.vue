<script setup lang="ts">
/** Convite para instalar o app. Na tela inicial pode ser dispensado; no perfil fica sempre. */
const props = defineProps<{ dispensavel?: boolean }>()
const { modo, dispensado, dispensar, instalar } = useInstalacao()
const { pronto } = useProntoSemInternet()

const passos = ref(false)
const visivel = computed(() => {
  if (modo.value === 'instalado') return !props.dispensavel
  if (props.dispensavel) return !dispensado.value && modo.value !== 'computador'
  return true
})
</script>

<template>
  <Transition name="cartao-instalar">
    <section v-if="visivel" class="cartao instalar" aria-labelledby="instalar-titulo">
      <div class="topo">
        <img src="/icon-192.png" alt="" width="48" height="48" class="icone-app">
        <div class="textos">
          <h2 id="instalar-titulo" class="titulo">
            {{ modo === 'instalado' ? 'App instalado' : 'Instale o app' }}
          </h2>
          <p class="suave">
            <template v-if="modo === 'instalado'">Abre pelo ícone na tela inicial, em tela cheia e sem internet.</template>
            <template v-else-if="modo === 'computador'">Abra protocolo-iatf.vercel.app no celular para instalar.</template>
            <template v-else>Abre pelo ícone, em tela cheia, e funciona sem internet.</template>
          </p>
        </div>
        <Icone v-if="modo === 'instalado'" nome="check" class="ok" />
      </div>

      <div v-if="modo === 'nativo' || modo === 'ios' || modo === 'android'" class="acoes">
        <button v-if="modo === 'nativo'" type="button" class="btn btn-primario" @click="instalar">Instalar app</button>
        <button v-else type="button" class="btn btn-primario" :aria-expanded="passos" @click="passos = !passos">
          {{ passos ? 'Fechar' : 'Como instalar' }}
        </button>
        <button v-if="dispensavel" type="button" class="btn" @click="dispensar">Agora não</button>
      </div>

      <p v-if="!dispensavel" class="sem-internet" :class="{ ok: pronto }" role="status">
        <Icone :nome="pronto ? 'check' : 'nuvem'" :tamanho="18" />
        {{ pronto ? 'Pronto para usar sem internet neste aparelho.' : 'Guardando o app para usar sem internet… deixe aberto com internet por alguns segundos.' }}
      </p>

      <Transition name="passos">
        <ol v-if="passos && modo === 'ios'" class="passos">
          <li>No Safari, toque em <strong>Compartilhar</strong> (o quadrado com a seta para cima). No iOS 26, toque antes em <strong>⋯</strong>.</li>
          <li>Role e toque em <strong>Adicionar à Tela de Início</strong>.</li>
          <li>Toque em <strong>Adicionar</strong>, no canto de cima.</li>
        </ol>
        <ol v-else-if="passos && modo === 'android'" class="passos">
          <li>Toque no menu do navegador (<strong>⋮</strong>).</li>
          <li>Toque em <strong>Instalar app</strong> ou <strong>Adicionar à tela inicial</strong>.</li>
          <li>Confirme em <strong>Instalar</strong>.</li>
        </ol>
      </Transition>
    </section>
  </Transition>
</template>

<style scoped>
.instalar { display: flex; flex-direction: column; gap: 14px; }
.topo { display: flex; align-items: center; gap: 14px; }
.icone-app { flex: none; border-radius: 12px; }
.textos { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 2px; }
.titulo { font-size: 17px; font-weight: 700; }
.ok { color: var(--primaria); }
.sem-internet { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 14px; color: var(--ambar-texto); }
.sem-internet.ok { color: var(--primaria); font-weight: 500; }
.acoes { display: flex; gap: 8px; flex-wrap: wrap; }
.acoes .btn { flex: 1; min-width: 140px; }
.passos { margin: 0; padding-left: 22px; display: flex; flex-direction: column; gap: 8px; font-size: 15px; line-height: 1.4; }
.passos strong { color: var(--primaria); }

.cartao-instalar-enter-active { animation: surgir var(--medio) var(--curva); }
.cartao-instalar-leave-active { transition: opacity var(--rapido), transform var(--rapido) ease-in; }
.cartao-instalar-leave-to { opacity: 0; transform: translateY(-6px); }
.passos-enter-active { transition: opacity var(--medio), transform var(--medio) var(--curva); }
.passos-enter-from { opacity: 0; transform: translateY(-6px); }
</style>
