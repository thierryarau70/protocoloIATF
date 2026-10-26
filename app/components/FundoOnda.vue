<script setup lang="ts">
/** Fundo em ondas de verde que se movem devagar (desenhado em baixa resolução e desfocado) */
const canvas = ref<HTMLCanvasElement>()
let laco = 0

onMounted(() => {
  const c = canvas.value
  const ctx = c?.getContext('2d')
  if (!c || !ctx) return
  const calmo = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const cores = ['#0E3B2B', '#1F5C45', '#3FA06F', '#B7E36A', '#E9F7B5']
  const desenhar = (t: number) => {
    const w = (c.width = Math.max(1, Math.ceil(c.clientWidth / 4)))
    const h = (c.height = Math.max(1, Math.ceil(c.clientHeight / 4)))
    ctx.fillStyle = '#07140F'
    ctx.fillRect(0, 0, w, h)
    cores.forEach((cor, i) => {
      ctx.beginPath()
      const base = h * (0.38 + i * 0.12)
      ctx.moveTo(0, h)
      for (let x = 0; x <= w; x += 2) {
        const y = base
          + Math.sin(x / w * Math.PI * (1.4 + i * 0.3) + t / (2600 - i * 300) + i) * h * 0.1
          + Math.sin(x / w * Math.PI * 3.1 - t / 1900 + i * 2) * h * 0.04
        ctx.lineTo(x, y)
      }
      ctx.lineTo(w, h)
      ctx.closePath()
      ctx.globalAlpha = 0.55 - i * 0.06
      ctx.fillStyle = cor
      ctx.fill()
    })
    ctx.globalAlpha = 1
    if (!calmo) laco = requestAnimationFrame(desenhar)
  }
  laco = requestAnimationFrame(desenhar)
})
onBeforeUnmount(() => cancelAnimationFrame(laco))
</script>

<template>
  <div class="fundo-onda" aria-hidden="true">
    <canvas ref="canvas" />
    <div class="grao" />
  </div>
</template>

<style scoped>
.fundo-onda { position: absolute; inset: 0; overflow: hidden; background: #07140F; }
canvas { position: absolute; inset: 0; width: 100%; height: 100%; filter: blur(30px) saturate(1.2); transform: scale(1.15); }
.grao { position: absolute; inset: 0; opacity: .12; background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"); }
</style>
