<script setup lang="ts">
definePageMeta({ layout: 'vazio' })
useHead({
  title: 'Protocolo IATF · DG e IATF no celular',
  meta: [{ name: 'description', content: 'DG, protocolo IATF, planilha, D45 e relatório em PDF no celular, funcionando sem internet no curral. R$ 79,99 por mês.' }],
})

const { usuario } = useAuth()
const destinoEntrar = computed(() => (usuario.value ? '/' : '/entrar'))

const titulo = ['O', 'IATF', 'inteiro', 'no', 'seu', 'celular.']
const marquee = ['DG', 'Protocolo', 'D8', 'D10', 'Inseminação', 'D45', 'Sêmen', 'Relatório PDF', 'Sem internet']

const etapas = [
  { dia: 'D0', titulo: 'DG do lote', texto: 'Uma vaca por vez, com botões grandes. Diga “doze, prenha, sessenta dias” e pronto. Ou leia o brinco pela câmera.', tela: '/landing/curral.jpg' },
  { dia: 'D8', titulo: 'Retira o implante', texto: 'A agenda avisa o dia e o horário. Hormônio anotado em um toque, vaca por vaca.', tela: '/landing/inicio.jpg' },
  { dia: 'D10', titulo: 'Inseminação', texto: 'Planilha IATF com o sêmen de cada vaca, quem não foi inseminada e por quê.', tela: '/landing/planilha.jpg' },
  { dia: 'D45', titulo: 'DG final', texto: 'Taxa de prenhez calculada na hora, por lote e por touro, com o relatório pronto para o fazendeiro.', tela: '/landing/painel.jpg' },
]

const recursos = [
  { icone: 'microfone', titulo: 'Ditado por voz', texto: 'Marque o DG falando, sem largar o aparelho de ultrassom.', grande: true },
  { icone: 'camera', titulo: 'Leitura do brinco', texto: 'Aponte a câmera e o número da vaca aparece.' },
  { icone: 'sem-rede', titulo: 'Sem internet', texto: 'Funciona no curral sem sinal e envia tudo quando a conexão volta.' },
  { icone: 'agenda', titulo: 'Agenda do protocolo', texto: 'D8, D10 e D45 de todas as fazendas, com o que vence hoje.' },
  { icone: 'ranking', titulo: 'Ranking de touros', texto: 'Qual sêmen emprenha mais, com base nos seus próprios resultados.', grande: true },
  { icone: 'documento', titulo: 'Relatório em PDF', texto: 'Resultado do lote, prenhez por sêmen e lista de vacas, prontos para enviar.' },
  { icone: 'estoque', titulo: 'Estoque', texto: 'Doses de sêmen e hormônios, com aviso antes de acabar.', grande: true },
  { icone: 'fazenda', titulo: 'Várias fazendas', texto: 'Painel de cada fazenda com o histórico de cada vaca.', grande: true },
] as const

const incluso = ['DG com ditado por voz e leitura de brinco', 'Protocolo IATF completo: D0, D8, D10 e D45', 'Planilha IATF e relatório em PDF', 'Ranking de touros e painel da fazenda', 'Estoque de sêmen e hormônios', 'Funciona sem internet, no Android e no iPhone']

const duvidas = [
  { p: 'Funciona mesmo sem internet?', r: 'Sim. Abra o app uma vez com internet e ele fica guardado no celular. No curral, tudo o que você registra fica salvo no aparelho e é enviado sozinho quando o sinal volta.' },
  { p: 'Preciso baixar na loja de aplicativos?', r: 'Não. Abra o site no celular e toque em “Instalar app” (Android) ou “Adicionar à Tela de Início” (iPhone). Ele ganha ícone e abre em tela cheia, como qualquer app.' },
  { p: 'Serve para mais de uma fazenda?', r: 'Sim. Cadastre quantas propriedades e lotes precisar; a agenda junta os manejos de todas.' },
  { p: 'O que o fazendeiro recebe?', r: 'Um relatório em PDF com a taxa de inseminação, a taxa de prenhez, o resultado por sêmen e a lista de vacas, além da planilha para baixar.' },
]
const aberta = ref<number | null>(0)

// Preço que "rola" como um contador ao aparecer
const preco = ['7', '9', ',', '9', '9']

const raiz = ref<HTMLElement>()
const fluxo = ref<HTMLElement>()
const etapaAtiva = ref(0)
const progressoFluxo = ref(0)
const navCompacta = ref(false)
const giro = ref(0)

let limpar: (() => void)[] = []

onMounted(() => {
  const el = raiz.value!
  const calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches

  // Revela os elementos ao entrar na tela
  const observador = new IntersectionObserver((entradas) => {
    for (const e of entradas) {
      if (e.isIntersecting) {
        e.target.classList.add('visivel')
        observador.unobserve(e.target)
      }
    }
  }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' })
  el.querySelectorAll('[data-revelar]').forEach(n => observador.observe(n))
  limpar.push(() => observador.disconnect())

  // Rolagem: menu que encolhe, fluxo preso na tela, carrossel que gira, faixa que acelera
  let velocidade = 0
  let ultimoY = window.scrollY
  let quadro = 0
  const aoRolar = () => {
    cancelAnimationFrame(quadro)
    quadro = requestAnimationFrame(() => {
      const y = window.scrollY
      velocidade = Math.min(40, Math.abs(y - ultimoY))
      ultimoY = y
      navCompacta.value = y > 60
      const f = fluxo.value
      if (f) {
        const caixa = f.getBoundingClientRect()
        const total = caixa.height - window.innerHeight
        const p = Math.min(1, Math.max(0, -caixa.top / total))
        progressoFluxo.value = p
        etapaAtiva.value = Math.min(etapas.length - 1, Math.floor(p * etapas.length * 0.999))
      }
      el.style.setProperty('--rolagem', String(y))
    })
  }
  window.addEventListener('scroll', aoRolar, { passive: true })
  aoRolar()
  limpar.push(() => window.removeEventListener('scroll', aoRolar))

  // Carrossel cilíndrico e faixa de palavras: giram sozinhos e mais rápido quando a página rola
  let marqueeX = 0
  let anterior = performance.now()
  let laco = 0
  const faixas = el.querySelectorAll<HTMLElement>('.marquee-trilho')
  const animar = (agora: number) => {
    const dt = Math.min(64, agora - anterior) / 16.67
    anterior = agora
    velocidade *= 0.92
    if (!calmo) {
      giro.value = (giro.value + (0.18 + velocidade * 0.06) * dt) % 360
      marqueeX -= (1.1 + velocidade * 0.35) * dt
      faixas.forEach((f, i) => {
        const largura = f.scrollWidth / 2
        const x = ((marqueeX * (i % 2 ? -0.8 : 1)) % largura + largura) % largura
        f.style.transform = `translate3d(${-x}px,0,0)`
      })
    }
    laco = requestAnimationFrame(animar)
  }
  laco = requestAnimationFrame(animar)
  limpar.push(() => cancelAnimationFrame(laco))

  // Mouse: cursor que segue, luz nos cartões e o celular que inclina
  if (window.matchMedia('(pointer: fine)').matches && !calmo) {
    const aoMover = (e: PointerEvent) => {
      el.style.setProperty('--mx', `${e.clientX}px`)
      el.style.setProperty('--my', `${e.clientY}px`)
      el.style.setProperty('--inclina-x', String((e.clientY / window.innerHeight - 0.5) * -14))
      el.style.setProperty('--inclina-y', String((e.clientX / window.innerWidth - 0.5) * 18))
      const alvo = (e.target as HTMLElement).closest<HTMLElement>('.recurso, .preco-cartao')
      if (alvo) {
        const c = alvo.getBoundingClientRect()
        alvo.style.setProperty('--lx', `${e.clientX - c.left}px`)
        alvo.style.setProperty('--ly', `${e.clientY - c.top}px`)
      }
    }
    window.addEventListener('pointermove', aoMover, { passive: true })
    limpar.push(() => window.removeEventListener('pointermove', aoMover))
    el.classList.add('com-cursor')
  }
})
onBeforeUnmount(() => {
  limpar.forEach(f => f())
  limpar = []
})

/** Botões "magnéticos": puxam levemente na direção do mouse */
function imantar(e: PointerEvent) {
  const alvo = e.currentTarget as HTMLElement
  const c = alvo.getBoundingClientRect()
  alvo.style.transform = `translate(${(e.clientX - c.left - c.width / 2) * 0.25}px, ${(e.clientY - c.top - c.height / 2) * 0.35}px)`
}
function soltar(e: PointerEvent) {
  (e.currentTarget as HTMLElement).style.transform = ''
}
</script>

<template>
  <div ref="raiz" class="lp">
    <div class="cursor" aria-hidden="true" />

    <!-- Menu que encolhe e vira uma pílula de vidro ao rolar -->
    <header class="nav" :class="{ compacta: navCompacta }">
      <a href="#topo" class="nav-marca">
        <img src="/icon.svg" alt="" width="30" height="30">
        <span>Protocolo IATF</span>
      </a>
      <nav class="nav-links" aria-label="Seções">
        <a href="#fluxo">Fluxo</a>
        <a href="#recursos">Recursos</a>
        <a href="#preco">Preço</a>
        <a href="#duvidas">Dúvidas</a>
      </nav>
      <div class="nav-acoes">
        <NuxtLink :to="destinoEntrar" class="nav-entrar">{{ usuario ? 'Abrir o app' : 'Entrar' }}</NuxtLink>
        <NuxtLink to="/cadastro" class="nav-cta">Assinar</NuxtLink>
      </div>
    </header>

    <!-- Topo -->
    <section id="topo" class="hero">
      <FundoOnda class="onda" />
      <div class="hero-conteudo">
        <div class="selo" data-revelar>
          <span class="pulso" />Funciona sem internet no curral
        </div>
        <h1 class="hero-titulo" aria-label="O IATF inteiro no seu celular.">
          <span v-for="(p, i) in titulo" :key="i" class="palavra" aria-hidden="true">
            <span class="palavra-dentro" :class="{ destaque: p === 'IATF' || p === 'celular.' }" :style="{ animationDelay: `${0.15 + i * 0.09}s` }">{{ p }}</span>
          </span>
        </h1>
        <p class="hero-sub">DG, protocolo, planilha, D45 e relatório em PDF. Feito para o veterinário que trabalha no curral, com uma mão na vaca e a outra no celular.</p>
        <div class="hero-acoes">
          <NuxtLink to="/cadastro" class="btn-lp btn-lp-claro" @pointermove="imantar" @pointerleave="soltar">
            Assinar por R$ 79,99/mês
            <Icone nome="avancar" :tamanho="18" />
          </NuxtLink>
          <a href="#fluxo" class="btn-lp btn-lp-vidro" @pointermove="imantar" @pointerleave="soltar">Ver como funciona</a>
        </div>
      </div>

      <div class="hero-celular">
        <div class="celular celular-inclina">
          <img src="/landing/inicio.jpg" alt="Tela inicial do app com a agenda de manejos" width="375" height="812">
        </div>
        <div class="flutua f1"><b>Vaca 0487</b> Prenha · 60 dias</div>
        <div class="flutua f2"><span class="ponto-verde" /> Taxa de prenhez <b>66,7%</b></div>
        <div class="flutua f3"><Icone nome="microfone" :tamanho="16" /> “doze, vazia”</div>
      </div>
      <div class="rolar" aria-hidden="true"><span /></div>
    </section>

    <!-- Faixa infinita de palavras -->
    <section class="marquee" aria-label="Etapas e recursos">
      <div v-for="linha in 2" :key="linha" class="marquee-linha" :class="{ contorno: linha === 2 }">
        <div class="marquee-trilho">
          <span v-for="(m, i) in [...marquee, ...marquee]" :key="i">{{ m }}<i>✦</i></span>
        </div>
      </div>
    </section>

    <!-- Fluxo preso na tela enquanto rola -->
    <section id="fluxo" ref="fluxo" class="fluxo">
      <div class="fluxo-preso">
        <div class="fluxo-texto">
          <div class="lp-rotulo" data-revelar>O fluxo</div>
          <h2 class="lp-titulo" data-revelar>Do D0 ao D45,<br><em>sem papel.</em></h2>
          <div class="trilha">
            <div class="trilha-barra" :style="{ transform: `scaleX(${Math.min(1, progressoFluxo * etapas.length / (etapas.length - 1))})` }" />
            <button
              v-for="(e, i) in etapas" :key="e.dia" type="button" class="trilha-no" :class="{ ativo: i <= etapaAtiva, atual: i === etapaAtiva }"
              :style="{ left: `${(i / (etapas.length - 1)) * 100}%` }" :aria-label="e.dia"
            >
              {{ e.dia }}
            </button>
          </div>
          <div class="etapa-texto">
            <Transition name="troca" mode="out-in">
              <div :key="etapaAtiva">
                <div class="etapa-dia">{{ etapas[etapaAtiva]!.dia }}</div>
                <h3>{{ etapas[etapaAtiva]!.titulo }}</h3>
                <p>{{ etapas[etapaAtiva]!.texto }}</p>
              </div>
            </Transition>
          </div>
        </div>
        <div class="fluxo-celular">
          <div class="celular">
            <TransitionGroup name="tela">
              <img v-for="(e, i) in etapas" v-show="i === etapaAtiva" :key="e.tela" :src="e.tela" alt="" width="375" height="812">
            </TransitionGroup>
          </div>
          <div class="anel-progresso" :style="{ '--p': progressoFluxo }" />
        </div>
      </div>
    </section>

    <!-- Carrossel cilíndrico com as telas reais -->
    <section class="cilindro-secao">
      <div class="lp-rotulo centro" data-revelar>Telas reais do app</div>
      <h2 class="lp-titulo centro" data-revelar>Tudo à mão,<br><em>em qualquer tela.</em></h2>
      <div class="cilindro-palco">
        <div class="cilindro" :style="{ transform: `translateZ(-460px) rotateY(${-giro}deg)` }">
          <div
            v-for="(tela, i) in ['inicio', 'curral', 'planilha', 'painel', 'relatorio2', 'curral', 'painel', 'planilha']" :key="i"
            class="cilindro-item" :style="{ transform: `rotateY(${i * 45}deg) translateZ(460px)` }"
          >
            <img :src="`/landing/${tela}.jpg`" alt="" loading="lazy" width="375" height="812">
          </div>
        </div>
      </div>
    </section>

    <!-- Recursos em grade, com luz que segue o mouse -->
    <section id="recursos" class="recursos">
      <div class="lp-rotulo" data-revelar>Recursos</div>
      <h2 class="lp-titulo" data-revelar>Pensado para o curral,<br><em>não para o escritório.</em></h2>
      <div class="grade-recursos">
        <article
          v-for="(r, i) in recursos" :key="r.titulo" class="recurso" :class="{ grande: 'grande' in r && r.grande }"
          data-revelar :style="{ transitionDelay: `${(i % 4) * 70}ms` }"
        >
          <div class="recurso-icone"><Icone :nome="r.icone" :tamanho="26" /></div>
          <h3>{{ r.titulo }}</h3>
          <p>{{ r.texto }}</p>
        </article>
      </div>
    </section>

    <!-- Preço -->
    <section id="preco" class="preco">
      <div class="lp-rotulo centro" data-revelar>Preço</div>
      <h2 class="lp-titulo centro" data-revelar>Um plano. <em>Tudo incluído.</em></h2>
      <div class="preco-cartao" data-revelar>
        <div class="preco-borda" aria-hidden="true" />
        <div class="preco-dentro">
          <div class="preco-plano">Mensal</div>
          <div class="preco-valor" aria-label="R$ 79,99 por mês">
            <span class="moeda">R$</span>
            <span v-for="(d, i) in preco" :key="i" class="digito" :class="{ virgula: d === ',' }" aria-hidden="true">
              <span class="digito-rolo" :style="{ '--alvo': d === ',' ? 0 : Number(d), transitionDelay: `${0.2 + i * 0.12}s` }">
                <template v-if="d === ','">,</template>
                <span v-for="n in 10" v-else :key="n">{{ n - 1 }}</span>
              </span>
            </span>
            <span class="mes">/mês</span>
          </div>
          <ul class="incluso">
            <li v-for="(item, i) in incluso" :key="item" :style="{ transitionDelay: `${0.5 + i * 0.08}s` }">
              <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M5 12l5 5 9-10" /></svg>
              {{ item }}
            </li>
          </ul>
          <NuxtLink to="/cadastro" class="btn-lp btn-lp-claro btn-lp-bloco" @pointermove="imantar" @pointerleave="soltar">
            Assinar agora
            <Icone nome="avancar" :tamanho="18" />
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Dúvidas -->
    <section id="duvidas" class="duvidas">
      <div class="lp-rotulo" data-revelar>Dúvidas</div>
      <h2 class="lp-titulo" data-revelar>Perguntas <em>frequentes.</em></h2>
      <div class="lista-duvidas">
        <div v-for="(d, i) in duvidas" :key="d.p" class="duvida" :class="{ aberta: aberta === i }" data-revelar>
          <button type="button" class="duvida-pergunta" :aria-expanded="aberta === i" @click="aberta = aberta === i ? null : i">
            {{ d.p }}
            <span class="mais" aria-hidden="true" />
          </button>
          <div class="duvida-resposta"><div><p>{{ d.r }}</p></div></div>
        </div>
      </div>
    </section>

    <!-- Chamada final -->
    <section class="final">
      <h2 class="final-titulo" data-revelar>Menos papel.<br><em>Mais prenhez.</em></h2>
      <NuxtLink to="/cadastro" class="btn-lp btn-lp-claro btn-lp-grande" data-revelar @pointermove="imantar" @pointerleave="soltar">
        Começar agora · R$ 79,99/mês
        <Icone nome="avancar" :tamanho="20" />
      </NuxtLink>
    </section>

    <footer class="rodape">
      <div class="nav-marca"><img src="/icon.svg" alt="" width="26" height="26"><span>Protocolo IATF</span></div>
      <NuxtLink :to="destinoEntrar">{{ usuario ? 'Abrir o app' : 'Já sou assinante · Entrar' }}</NuxtLink>
    </footer>
  </div>
</template>

<style scoped>
.lp {
  --lp-fundo: #07140F;
  --lp-fundo-2: #0C1F17;
  --lp-texto: #EEF5EF;
  --lp-suave: #A3B8AA;
  --lp-verde: #3FA06F;
  --lp-lima: #C6EC72;
  --lp-borda: rgba(238, 245, 239, .12);
  --mola: cubic-bezier(.16, 1, .3, 1);
  background: var(--lp-fundo);
  color: var(--lp-texto);
  overflow-x: clip;
  min-height: 100dvh;
}
.lp :deep(em), .lp em { font-style: normal; background: linear-gradient(100deg, var(--lp-lima), #7FD69A 60%, var(--lp-verde)); -webkit-background-clip: text; background-clip: text; color: transparent; }

/* Cursor que segue o mouse */
.cursor { display: none; }
.com-cursor .cursor {
  display: block; position: fixed; z-index: 100; left: 0; top: 0; width: 26px; height: 26px; margin: -13px 0 0 -13px; border-radius: 50%;
  background: var(--lp-lima); mix-blend-mode: difference; pointer-events: none;
  transform: translate(var(--mx, -100px), var(--my, -100px)); transition: transform 120ms var(--mola), width .3s, height .3s;
}

/* Menu */
.nav {
  position: fixed; z-index: 50; top: 16px; left: 50%; transform: translateX(-50%);
  width: min(1180px, calc(100% - 32px)); display: flex; align-items: center; justify-content: space-between; gap: 16px;
  padding: 10px 12px 10px 18px; border-radius: 999px; border: 1px solid transparent;
  transition: width .6s var(--mola), background .4s, border-color .4s, padding .4s, top .4s;
}
.nav.compacta { width: min(760px, calc(100% - 24px)); top: 10px; background: rgba(9, 24, 18, .72); border-color: var(--lp-borda); backdrop-filter: blur(16px) saturate(1.4); -webkit-backdrop-filter: blur(16px) saturate(1.4); }
.nav-marca { display: flex; align-items: center; gap: 10px; font-weight: 700; letter-spacing: -.01em; }
.nav-links { display: flex; gap: 4px; }
.nav-links a { padding: 8px 14px; border-radius: 999px; font-size: 14px; color: var(--lp-suave); transition: color .2s, background .2s; }
.nav-links a:hover { color: var(--lp-texto); background: rgba(238, 245, 239, .08); }
.nav-acoes { display: flex; align-items: center; gap: 6px; }
.nav-entrar { padding: 9px 14px; font-size: 14px; font-weight: 500; }
.nav-cta { padding: 10px 18px; border-radius: 999px; background: var(--lp-lima); color: #0B1A12; font-size: 14px; font-weight: 700; transition: transform .3s var(--mola); }
.nav-cta:hover { transform: scale(1.06); }

/* Topo */
.hero { position: relative; min-height: 100svh; display: grid; grid-template-columns: 1.15fr .85fr; align-items: center; gap: 40px; padding: 140px max(24px, calc((100% - 1180px) / 2)) 80px; overflow: hidden; }
.hero::after { content: ''; position: absolute; inset: 0; background: radial-gradient(120% 80% at 20% 30%, transparent 30%, var(--lp-fundo) 85%), linear-gradient(to bottom, transparent 60%, var(--lp-fundo)); pointer-events: none; }
.hero-conteudo, .hero-celular, .rolar { position: relative; z-index: 2; }
.selo { display: inline-flex; align-items: center; gap: 10px; padding: 8px 16px 8px 12px; border-radius: 999px; background: rgba(238, 245, 239, .08); border: 1px solid var(--lp-borda); font-size: 14px; font-weight: 500; backdrop-filter: blur(8px); }
.pulso { width: 9px; height: 9px; border-radius: 50%; background: var(--lp-lima); box-shadow: 0 0 0 0 rgba(198, 236, 114, .7); animation: pulsar 1.8s infinite; }
@keyframes pulsar { 70% { box-shadow: 0 0 0 12px rgba(198, 236, 114, 0); } 100% { box-shadow: 0 0 0 0 rgba(198, 236, 114, 0); } }
.hero-titulo { margin: 22px 0 22px; font-size: clamp(48px, 8.2vw, 118px); line-height: .95; letter-spacing: -.045em; font-weight: 700; }
.palavra { display: inline-block; overflow: hidden; padding-bottom: .1em; margin-bottom: -.1em; margin-right: .22em; vertical-align: top; }
.palavra-dentro { display: inline-block; transform: translateY(110%) rotate(8deg); transform-origin: left bottom; animation: subir-palavra 1.1s var(--mola) forwards; }
.palavra-dentro.destaque { background: linear-gradient(100deg, var(--lp-lima), #7FD69A 60%, var(--lp-verde)); -webkit-background-clip: text; background-clip: text; color: transparent; }
@keyframes subir-palavra { to { transform: none; } }
.hero-sub { max-width: 560px; font-size: clamp(17px, 1.6vw, 20px); line-height: 1.5; color: var(--lp-suave); opacity: 0; animation: aparecer 1s var(--mola) .8s forwards; }
.hero-acoes { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 34px; opacity: 0; animation: aparecer 1s var(--mola) 1s forwards; }
@keyframes aparecer { from { opacity: 0; transform: translateY(24px); filter: blur(6px); } to { opacity: 1; transform: none; filter: none; } }

.btn-lp { display: inline-flex; align-items: center; justify-content: center; gap: 10px; min-height: 56px; padding: 0 26px; border-radius: 999px; font-size: 16px; font-weight: 700; transition: transform .35s var(--mola), box-shadow .35s, background .3s; will-change: transform; }
.btn-lp-claro { background: var(--lp-lima); color: #0B1A12; box-shadow: 0 10px 40px -10px rgba(198, 236, 114, .6); }
.btn-lp-claro:hover { box-shadow: 0 16px 60px -8px rgba(198, 236, 114, .85); }
.btn-lp-vidro { background: rgba(238, 245, 239, .08); border: 1px solid var(--lp-borda); backdrop-filter: blur(8px); }
.btn-lp-vidro:hover { background: rgba(238, 245, 239, .16); }
.btn-lp-bloco { width: 100%; }
.btn-lp-grande { min-height: 68px; padding: 0 36px; font-size: 19px; }

.hero-celular { justify-self: center; perspective: 1200px; opacity: 0; animation: celular-entra 1.4s var(--mola) .4s forwards; }
@keyframes celular-entra { from { opacity: 0; transform: translateY(80px) rotate(6deg) scale(.9); } to { opacity: 1; transform: none; } }
.celular { position: relative; width: 300px; aspect-ratio: 375 / 812; border-radius: 46px; padding: 11px; background: linear-gradient(145deg, #2A3A31, #0D1712); box-shadow: 0 50px 100px -30px rgba(0, 0, 0, .8), inset 0 0 0 1px rgba(255, 255, 255, .08); }
.celular img { position: absolute; inset: 11px; width: calc(100% - 22px); height: calc(100% - 22px); object-fit: cover; object-position: top; border-radius: 36px; }
.celular-inclina { transform: rotateX(calc(var(--inclina-x, 0) * 1deg)) rotateY(calc(var(--inclina-y, -8) * 1deg)); transition: transform .5s var(--mola); transform-style: preserve-3d; animation: boiar 6s ease-in-out infinite; }
@keyframes boiar { 50% { translate: 0 -14px; } }
.flutua { position: absolute; z-index: 3; display: flex; align-items: center; gap: 8px; padding: 12px 16px; border-radius: 16px; font-size: 14px; white-space: nowrap; background: rgba(12, 31, 23, .78); border: 1px solid var(--lp-borda); backdrop-filter: blur(14px); box-shadow: 0 20px 40px -12px rgba(0, 0, 0, .6); opacity: 0; animation: aparecer .9s var(--mola) forwards, boiar 5s ease-in-out infinite; }
.flutua b { color: var(--lp-lima); }
.f1 { left: -90px; top: 22%; animation-delay: 1.3s, 1.3s; }
.f2 { right: -70px; top: 52%; animation-delay: 1.5s, 2s; }
.f3 { left: -60px; bottom: 12%; animation-delay: 1.7s, 2.6s; }
.ponto-verde { width: 8px; height: 8px; border-radius: 50%; background: var(--lp-lima); }
.rolar { position: absolute; left: 50%; bottom: 28px; width: 26px; height: 42px; margin-left: -13px; border: 2px solid var(--lp-borda); border-radius: 14px; }
.rolar span { position: absolute; left: 50%; top: 8px; width: 4px; height: 8px; margin-left: -2px; border-radius: 2px; background: var(--lp-lima); animation: rodinha 1.6s var(--mola) infinite; }
@keyframes rodinha { 70% { transform: translateY(12px); opacity: 0; } 100% { opacity: 0; } }

/* Faixa infinita */
.marquee { padding: 40px 0; border-block: 1px solid var(--lp-borda); overflow: hidden; transform: rotate(-2deg) scale(1.04); background: var(--lp-fundo-2); }
.marquee-linha { overflow: hidden; }
.marquee-trilho { display: flex; width: max-content; will-change: transform; }
.marquee-trilho span { display: inline-flex; align-items: center; gap: 36px; padding-right: 36px; font-size: clamp(42px, 7vw, 92px); font-weight: 700; letter-spacing: -.04em; line-height: 1.1; }
.marquee-trilho i { font-style: normal; font-size: .4em; color: var(--lp-lima); }
.contorno .marquee-trilho span { color: transparent; -webkit-text-stroke: 1.5px rgba(198, 236, 114, .55); }

/* Seções */
.lp-rotulo { font-size: 13px; font-weight: 700; letter-spacing: .14em; text-transform: uppercase; color: var(--lp-lima); margin-bottom: 18px; }
.lp-titulo { font-size: clamp(38px, 5.6vw, 76px); line-height: 1; letter-spacing: -.04em; font-weight: 700; }
.centro { text-align: center; }
[data-revelar] { opacity: 0; transform: translateY(46px); filter: blur(8px); transition: opacity 1s var(--mola), transform 1.1s var(--mola), filter 1s var(--mola); }
[data-revelar].visivel { opacity: 1; transform: none; filter: none; }

/* Fluxo preso */
.fluxo { position: relative; height: 420vh; }
.fluxo-preso { position: sticky; top: 0; height: 100svh; display: grid; grid-template-columns: 1fr auto; align-items: center; gap: 60px; padding: 90px max(24px, calc((100% - 1180px) / 2)) 40px; }
.trilha { position: relative; height: 64px; margin: 50px 30px 40px; }
.trilha::before, .trilha-barra { content: ''; position: absolute; left: 0; right: 0; top: 50%; height: 4px; margin-top: -2px; border-radius: 2px; background: var(--lp-borda); }
.trilha-barra { background: linear-gradient(90deg, var(--lp-verde), var(--lp-lima)); transform-origin: left; box-shadow: 0 0 24px rgba(198, 236, 114, .5); }
.trilha-no { position: absolute; top: 50%; width: 64px; height: 64px; margin: -32px 0 0 -32px; border-radius: 50%; border: 2px solid var(--lp-borda); background: var(--lp-fundo); color: var(--lp-suave); font-weight: 700; font-size: 16px; transition: all .5s var(--mola); cursor: default; }
.trilha-no.ativo { border-color: var(--lp-lima); color: var(--lp-texto); }
.trilha-no.atual { background: var(--lp-lima); color: #0B1A12; transform: scale(1.18); box-shadow: 0 0 0 10px rgba(198, 236, 114, .12), 0 0 40px rgba(198, 236, 114, .5); }
.etapa-texto { min-height: 190px; }
.etapa-dia { font-size: 15px; font-weight: 700; color: var(--lp-lima); letter-spacing: .1em; }
.etapa-texto h3 { margin: 8px 0 12px; font-size: clamp(30px, 3.4vw, 46px); letter-spacing: -.03em; }
.etapa-texto p { max-width: 520px; font-size: 18px; line-height: 1.55; color: var(--lp-suave); }
.troca-enter-active, .troca-leave-active { transition: opacity .45s var(--mola), transform .55s var(--mola), filter .45s; }
.troca-enter-from { opacity: 0; transform: translateY(30px); filter: blur(6px); }
.troca-leave-to { opacity: 0; transform: translateY(-30px); filter: blur(6px); }
.fluxo-celular { position: relative; }
.fluxo-celular .celular { width: 320px; }
.tela-enter-active, .tela-leave-active { transition: opacity .6s var(--mola), transform .7s var(--mola), clip-path .7s var(--mola); }
.tela-enter-from { opacity: 0; transform: scale(1.06); clip-path: inset(100% 0 0 0 round 36px); }
.tela-leave-to { opacity: 0; transform: scale(.96); }
.anel-progresso { position: absolute; inset: -34px; z-index: -1; border-radius: 70px; background: conic-gradient(var(--lp-lima) calc(var(--p) * 360deg), transparent 0); filter: blur(28px); opacity: .45; }

/* Carrossel cilíndrico */
.cilindro-secao { padding: 140px 24px 60px; overflow: hidden; }
.cilindro-palco { height: 640px; margin-top: 40px; perspective: 1400px; display: flex; align-items: center; justify-content: center; mask-image: linear-gradient(90deg, transparent, #000 18%, #000 82%, transparent); }
.cilindro { position: relative; width: 230px; height: 498px; transform-style: preserve-3d; }
.cilindro-item { position: absolute; inset: 0; backface-visibility: hidden; border-radius: 30px; overflow: hidden; border: 1px solid var(--lp-borda); box-shadow: 0 30px 60px -20px rgba(0, 0, 0, .7); }
.cilindro-item img { width: 100%; height: 100%; object-fit: cover; object-position: top; display: block; }

/* Recursos */
.recursos { padding: 120px max(24px, calc((100% - 1180px) / 2)); }
.grade-recursos { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-top: 56px; }
.recurso {
  position: relative; overflow: hidden; padding: 30px 26px; border-radius: 26px; border: 1px solid var(--lp-borda);
  background: radial-gradient(420px circle at var(--lx, -100px) var(--ly, -100px), rgba(198, 236, 114, .16), transparent 45%), var(--lp-fundo-2);
  transition: opacity 1s var(--mola), transform .9s var(--mola), filter 1s, border-color .3s;
}
.recurso.grande { grid-column: span 2; }
.recurso:hover { border-color: rgba(198, 236, 114, .45); transform: translateY(-6px); }
.recurso-icone { width: 54px; height: 54px; display: grid; place-items: center; border-radius: 16px; background: rgba(198, 236, 114, .12); color: var(--lp-lima); margin-bottom: 26px; transition: transform .5s var(--mola); }
.recurso:hover .recurso-icone { transform: rotate(-10deg) scale(1.12); }
.recurso h3 { font-size: 22px; letter-spacing: -.02em; margin-bottom: 10px; }
.recurso p { color: var(--lp-suave); line-height: 1.5; }

/* Preço */
.preco { padding: 120px 24px; }
.preco-cartao { position: relative; max-width: 520px; margin: 56px auto 0; border-radius: 34px; padding: 2px; isolation: isolate; }
.preco-borda { position: absolute; inset: 0; z-index: -1; border-radius: inherit; overflow: hidden; }
.preco-borda::before { content: ''; position: absolute; inset: -60%; background: conic-gradient(from 0deg, transparent 0 55%, var(--lp-lima) 70%, var(--lp-verde) 80%, transparent 92%); animation: girar 4s linear infinite; }
@keyframes girar { to { transform: rotate(1turn); } }
.preco-dentro { padding: 40px 34px 34px; border-radius: 32px; background: radial-gradient(500px circle at var(--lx, 50%) var(--ly, 0%), rgba(198, 236, 114, .12), transparent 50%), #0B1C15; }
.preco-plano { display: inline-block; padding: 6px 14px; border-radius: 999px; background: rgba(198, 236, 114, .12); color: var(--lp-lima); font-weight: 700; font-size: 14px; }
.preco-valor { display: flex; align-items: flex-end; margin: 22px 0 26px; font-weight: 700; letter-spacing: -.04em; }
.moeda { font-size: 28px; margin: 0 8px 18px 0; color: var(--lp-suave); }
.mes { font-size: 22px; margin: 0 0 16px 8px; color: var(--lp-suave); letter-spacing: 0; }
.digito { display: inline-block; height: 1em; overflow: hidden; font-size: 92px; line-height: 1; font-variant-numeric: tabular-nums; margin-right: -.03em; }
.digito.virgula { width: .3em; }
.digito-rolo { display: flex; flex-direction: column; transform: translateY(0); transition: transform 1.6s var(--mola); }
.preco-cartao.visivel .digito-rolo { transform: translateY(calc(var(--alvo) * -1em)); }
.incluso { list-style: none; margin: 0 0 30px; padding: 0; display: flex; flex-direction: column; gap: 14px; }
.incluso li { display: flex; gap: 12px; align-items: flex-start; font-size: 16px; line-height: 1.4; opacity: 0; transform: translateX(-16px); transition: opacity .6s var(--mola), transform .6s var(--mola); }
.incluso svg { flex: none; fill: none; stroke: var(--lp-lima); stroke-width: 2.6; stroke-linecap: round; stroke-linejoin: round; stroke-dasharray: 22; stroke-dashoffset: 22; transition: stroke-dashoffset .6s var(--mola); transition-delay: inherit; }
.preco-cartao.visivel .incluso li { opacity: 1; transform: none; }
.preco-cartao.visivel .incluso svg { stroke-dashoffset: 0; transition-delay: inherit; }

/* Dúvidas */
.duvidas { padding: 80px max(24px, calc((100% - 860px) / 2)) 120px; }
.lista-duvidas { margin-top: 44px; border-top: 1px solid var(--lp-borda); }
.duvida { border-bottom: 1px solid var(--lp-borda); }
.duvida-pergunta { width: 100%; display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 26px 0; border: 0; background: none; text-align: left; font-size: clamp(18px, 2vw, 22px); font-weight: 500; }
.mais { position: relative; flex: none; width: 34px; height: 34px; border-radius: 50%; border: 1px solid var(--lp-borda); transition: transform .5s var(--mola), background .3s; }
.mais::before, .mais::after { content: ''; position: absolute; left: 50%; top: 50%; width: 12px; height: 2px; margin: -1px 0 0 -6px; background: currentColor; border-radius: 1px; }
.mais::after { transform: rotate(90deg); }
.aberta .mais { transform: rotate(135deg); background: var(--lp-lima); color: #0B1A12; }
.duvida-resposta { display: grid; grid-template-rows: 0fr; transition: grid-template-rows .55s var(--mola); }
.duvida-resposta > div { overflow: hidden; }
.aberta .duvida-resposta { grid-template-rows: 1fr; }
.duvida-resposta p { padding-bottom: 26px; max-width: 680px; color: var(--lp-suave); font-size: 17px; line-height: 1.6; }

/* Final */
.final { position: relative; padding: 160px 24px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 48px; overflow: hidden; }
.final::before { content: ''; position: absolute; left: 50%; top: 50%; width: 900px; height: 900px; margin: -450px 0 0 -450px; border-radius: 50%; background: radial-gradient(circle, rgba(63, 160, 111, .35), transparent 60%); animation: respirar 6s ease-in-out infinite; pointer-events: none; }
@keyframes respirar { 50% { transform: scale(1.2); opacity: .7; } }
.final-titulo { position: relative; font-size: clamp(54px, 10vw, 150px); line-height: .92; letter-spacing: -.05em; }
.rodape { display: flex; justify-content: space-between; align-items: center; gap: 16px; flex-wrap: wrap; padding: 30px max(24px, calc((100% - 1180px) / 2)) 40px; border-top: 1px solid var(--lp-borda); color: var(--lp-suave); font-size: 14px; }
.rodape a:hover { color: var(--lp-texto); }

/* Celular */
@media (max-width: 960px) {
  .hero { grid-template-columns: 1fr; padding-top: 120px; text-align: left; }
  .hero-celular { margin-top: 20px; }
  .nav-links { display: none; }
  .fluxo { height: 380vh; }
  .fluxo-preso { grid-template-columns: 1fr; align-content: center; gap: 18px; padding-top: 80px; }
  .fluxo-celular { justify-self: center; order: -1; }
  .fluxo-celular .celular { width: 128px; border-radius: 26px; padding: 6px; }
  .fluxo-celular .celular img { inset: 6px; width: calc(100% - 12px); height: calc(100% - 12px); border-radius: 21px; }
  .fluxo .lp-titulo { font-size: 34px; }
  .fluxo .lp-rotulo { display: none; }
  .trilha { margin: 26px 30px 22px; }
  .etapa-texto { min-height: 160px; }
  .etapa-texto p { font-size: 16px; }
  .grade-recursos { grid-template-columns: 1fr 1fr; }
  .cilindro-palco { height: 460px; }
  .cilindro { width: 170px; height: 368px; }
}
@media (max-width: 560px) {
  .nav { padding-left: 14px; }
  .nav-marca span { display: none; }
  .celular { width: 250px; }
  .f1 { left: -40px; } .f2 { right: -30px; } .f3 { left: -24px; }
  .grade-recursos { grid-template-columns: 1fr; }
  .recurso.grande { grid-column: auto; }
  .digito { font-size: 72px; }
  .trilha-no { width: 48px; height: 48px; margin: -24px 0 0 -24px; font-size: 13px; }
  .preco-dentro { padding: 32px 22px 26px; }
}
@media (prefers-reduced-motion: reduce) {
  .lp *, .lp *::before, .lp *::after { animation-duration: 1ms !important; animation-iteration-count: 1 !important; transition-duration: 1ms !important; }
}
</style>
