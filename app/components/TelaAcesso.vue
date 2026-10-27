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
      <span class="alca" aria-hidden="true" />
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

.alca { display: none; }

/* Tablet: ondas na tela inteira, frase grande no alto e o formulário num cartão de vidro no meio */
@media (min-width: 600px) and (max-width: 1100px) {
  .acesso { position: relative; display: flex; flex-direction: column; overflow: hidden; }
  .painel { position: absolute; inset: 0; }
  .painel::after { background: radial-gradient(90% 60% at 50% 70%, rgba(7, 20, 15, .25), rgba(7, 20, 15, .65)); }
  .painel-conteudo { height: auto; justify-content: flex-start; align-items: center; text-align: center; gap: 36px; padding: calc(env(safe-area-inset-top) + 40px) 48px 0; }
  .painel-frase { font-size: clamp(44px, 7vw, 64px); }
  .painel-pontos { order: 3; }
  .lado-form { position: relative; z-index: 1; flex: 1; align-items: flex-start; padding: 330px 32px 48px; }
  .formulario {
    max-width: 480px; padding: 40px 40px 32px; border-radius: 32px;
    background: rgba(255, 255, 255, .9); border: 1px solid rgba(255, 255, 255, .6);
    backdrop-filter: blur(22px) saturate(1.5); -webkit-backdrop-filter: blur(22px) saturate(1.5);
    box-shadow: 0 40px 80px -30px rgba(0, 0, 0, .6), 0 0 0 1px rgba(7, 20, 15, .04);
    animation: cartao-flutua 1s cubic-bezier(.16, 1, .3, 1) .15s both;
  }
  .titulo-acesso { font-size: 38px; }
}
@keyframes cartao-flutua { from { opacity: 0; transform: translateY(70px) scale(.94); filter: blur(8px); } }

/* Celular: como um app. Topo verde e o formulário sobe de baixo como uma folha, com a alça */
@media (max-width: 599px) {
  .acesso { display: flex; flex-direction: column; background: #07140F; }
  .painel { flex: none; min-height: 36svh; }
  .painel-conteudo { height: 100%; min-height: 36svh; justify-content: space-between; gap: 20px; padding: calc(env(safe-area-inset-top) + 20px) 22px 52px; }
  .painel-frase { font-size: 36px; }
  .painel-pre { font-size: 20px; letter-spacing: -.01em; margin-bottom: 4px; }
  .painel-pontos { display: none; }
  .lado-form {
    position: relative; z-index: 1; flex: 1; flex-direction: column; justify-content: flex-start; align-items: stretch;
    margin-top: -28px; padding: 12px 20px calc(env(safe-area-inset-bottom) + 28px);
    background: var(--superficie); border-radius: 28px 28px 0 0; box-shadow: 0 -18px 40px -16px rgba(0, 0, 0, .55);
    animation: folha-sobe .9s cubic-bezier(.16, 1, .3, 1) .1s both;
  }
  .alca { display: block; align-self: center; width: 44px; height: 5px; border-radius: 3px; background: var(--borda); margin-bottom: 18px; }
  .formulario { max-width: none; gap: 16px; }
  .marca-icone { display: none; }
  .titulo-acesso { font-size: 30px; }
  .botao-acesso { min-height: 54px; border-radius: 16px; font-size: 17px; }
}
@keyframes folha-sobe { from { transform: translateY(100%); } }
@media (prefers-reduced-motion: reduce) {
  .acesso *, .acesso *::before, .acesso *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; }
}
</style>
