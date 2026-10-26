<script setup lang="ts">
defineProps<{ titulo: string, erro?: string, enviando?: boolean, botao: string }>()
defineEmits<{ enviar: [] }>()

// Frases que se revezam no painel verde
const frases = ['DG em segundos.', 'IATF sem papel.', 'Funciona sem internet.', 'Relatório pronto no D45.']
const frase = ref(0)
let temporizador: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  temporizador = setInterval(() => { frase.value = (frase.value + 1) % frases.length }, 2800)
})
onBeforeUnmount(() => clearInterval(temporizador))
</script>

<template>
  <div class="acesso">
    <aside class="painel">
      <FundoOnda />
      <div class="painel-conteudo">
        <NuxtLink to="/conheca" class="painel-marca">
          <img src="/icon.svg" alt="" width="36" height="36">
          Protocolo IATF
        </NuxtLink>
        <div class="painel-frase" aria-live="polite">
          <span class="painel-pre">No curral,</span>
          <span class="rotativa">
            <Transition name="frase" mode="out-in">
              <span :key="frase" class="rotativa-texto">{{ frases[frase] }}</span>
            </Transition>
          </span>
        </div>
        <ul class="painel-pontos" aria-hidden="true">
          <li v-for="(f, i) in frases" :key="f" :class="{ ativo: i === frase }" />
        </ul>
      </div>
    </aside>

    <main class="lado-form">
      <form class="formulario" @submit.prevent="$emit('enviar')">
        <div class="marca">
          <img src="/icon.svg" alt="" width="48" height="48" class="marca-icone">
          <div>
            <div class="sobrelinha">Protocolo IATF</div>
            <h1 class="titulo-acesso"><span>{{ titulo }}</span></h1>
          </div>
        </div>
        <div class="campos">
          <slot />
        </div>
        <Transition name="erro-acesso">
          <p v-if="erro" :key="erro" class="erro" role="alert">{{ erro }}</p>
        </Transition>
        <button type="submit" class="btn btn-primario btn-bloco botao-acesso" :class="{ enviando }" :disabled="enviando">
          <span class="botao-texto">{{ botao }}</span>
          <span class="giro" aria-hidden="true" />
          <span class="brilho" aria-hidden="true" />
        </button>
        <div class="rodape-acesso">
          <slot name="rodape" />
        </div>
      </form>
    </main>
  </div>
</template>

<style scoped>
.acesso { min-height: 100dvh; display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); background: var(--fundo); }

/* Painel verde em ondas */
.painel { position: relative; overflow: hidden; color: #EEF5EF; }
.painel::after { content: ''; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(7, 20, 15, .55), transparent 40%, rgba(7, 20, 15, .7)); }
.painel-conteudo { position: relative; z-index: 1; height: 100%; display: flex; flex-direction: column; justify-content: space-between; padding: 40px 48px; }
.painel-marca { display: inline-flex; align-items: center; gap: 12px; font-weight: 700; font-size: 18px; animation: entrar-cima .9s var(--curva) both; }
.painel-frase { font-size: clamp(40px, 4.6vw, 68px); font-weight: 700; line-height: 1.02; letter-spacing: -.04em; }
.painel-pre { display: block; color: rgba(238, 245, 239, .7); animation: entrar-baixo 1s var(--curva) .15s both; }
.rotativa { display: block; overflow: hidden; padding-bottom: .08em; }
.rotativa-texto { display: inline-block; background: linear-gradient(100deg, #C6EC72, #7FD69A 60%, #3FA06F); -webkit-background-clip: text; background-clip: text; color: transparent; }
.frase-enter-active { transition: transform .7s cubic-bezier(.16, 1, .3, 1), opacity .5s; }
.frase-leave-active { transition: transform .4s cubic-bezier(.7, 0, .84, 0), opacity .3s; }
.frase-enter-from { transform: translateY(105%) rotate(4deg); opacity: 0; }
.frase-leave-to { transform: translateY(-105%) rotate(-3deg); opacity: 0; }
.painel-pontos { list-style: none; display: flex; gap: 8px; margin: 0; padding: 0; }
.painel-pontos li { width: 8px; height: 8px; border-radius: 4px; background: rgba(238, 245, 239, .3); transition: width .5s var(--curva), background .3s; }
.painel-pontos li.ativo { width: 32px; background: #C6EC72; }

/* Formulário */
.lado-form { display: flex; align-items: center; justify-content: center; padding: 32px 24px; }
.formulario { width: 100%; max-width: 400px; display: flex; flex-direction: column; gap: 18px; }
.marca { display: flex; align-items: center; gap: 14px; margin-bottom: 6px; }
.marca-icone { animation: icone-entra 1s cubic-bezier(.34, 1.56, .64, 1) .1s both; }
@keyframes icone-entra { from { opacity: 0; transform: scale(.4) rotate(-30deg); } }
.marca .sobrelinha { animation: entrar-baixo .7s var(--curva) .2s both; }
.titulo-acesso { font-size: 34px; letter-spacing: -.03em; overflow: hidden; padding-bottom: .06em; }
.titulo-acesso span { display: block; animation: revelar-titulo .9s cubic-bezier(.16, 1, .3, 1) .25s both; }
@keyframes revelar-titulo { from { transform: translateY(105%); } }
/* Campos entram um depois do outro */
.campos { display: flex; flex-direction: column; gap: 16px; }
.campos > :deep(*) { animation: entrar-baixo .7s var(--curva) both; }
.campos > :deep(:nth-child(1)) { animation-delay: .35s; }
.campos > :deep(:nth-child(2)) { animation-delay: .45s; }
.campos > :deep(:nth-child(3)) { animation-delay: .55s; }
.campos > :deep(:nth-child(4)) { animation-delay: .65s; }
.campos :deep(.entrada) { transition: border-color .2s, box-shadow .3s var(--curva), transform .3s var(--curva); }
.campos :deep(.entrada:focus) { transform: translateY(-1px); box-shadow: 0 0 0 4px rgba(31, 92, 69, .14), 0 10px 24px -14px rgba(31, 92, 69, .6); }
.campos :deep(.campo:focus-within label) { color: var(--primaria); }
.campos :deep(label) { transition: color .2s; }

.botao-acesso { position: relative; overflow: hidden; animation: entrar-baixo .7s var(--curva) .75s both; transition: transform .25s var(--curva), box-shadow .3s; }
.botao-acesso:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 14px 30px -12px rgba(31, 92, 69, .7); }
.botao-acesso:active:not(:disabled) { transform: scale(.98); }
.brilho { position: absolute; top: 0; bottom: 0; left: -60%; width: 40%; background: linear-gradient(100deg, transparent, rgba(255, 255, 255, .35), transparent); transform: skewX(-20deg); animation: varrer 3.6s ease-in-out 1.6s infinite; }
@keyframes varrer { 0%, 70% { left: -60%; } 100% { left: 130%; } }
.giro { position: absolute; left: 50%; top: 50%; width: 22px; height: 22px; margin: -11px 0 0 -11px; border-radius: 50%; border: 2.5px solid rgba(255, 255, 255, .35); border-top-color: #fff; opacity: 0; animation: girar-acesso .7s linear infinite; }
@keyframes girar-acesso { to { transform: rotate(1turn); } }
.enviando .botao-texto { opacity: 0; }
.enviando .giro { opacity: 1; }
.rodape-acesso { display: flex; flex-direction: column; gap: 10px; animation: entrar-baixo .7s var(--curva) .85s both; }
.erro-acesso-enter-active { animation: tremer 420ms var(--curva); }
.erro-acesso-leave-active { transition: opacity .2s; }
.erro-acesso-leave-to { opacity: 0; }

@keyframes entrar-baixo { from { opacity: 0; transform: translateY(18px); filter: blur(4px); } }
@keyframes entrar-cima { from { opacity: 0; transform: translateY(-14px); } }

/* Celular: o painel vira uma faixa no topo e o formulário sobe por cima dela */
@media (max-width: 860px) {
  .acesso { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
  .painel { min-height: 0; }
  .painel-conteudo { padding: calc(env(safe-area-inset-top) + 22px) 22px 64px; gap: 26px; justify-content: flex-start; }
  .painel-frase { font-size: 34px; }
  .painel-pontos { display: none; }
  .lado-form { align-items: flex-start; margin-top: -32px; position: relative; z-index: 1; padding: 0 16px 32px; }
  .formulario { background: var(--superficie); border-radius: 26px; padding: 24px 20px; box-shadow: 0 -10px 40px -20px rgba(7, 20, 15, .5); animation: subir-cartao .9s cubic-bezier(.16, 1, .3, 1) both; }
  .marca-icone { display: none; }
}
@keyframes subir-cartao { from { transform: translateY(60px); opacity: 0; } }
@media (prefers-reduced-motion: reduce) {
  .acesso *, .acesso *::before, .acesso *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; }
}
</style>
