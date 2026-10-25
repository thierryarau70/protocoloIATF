<script setup lang="ts">
/**
 * Lê o número do brinco por uma foto (Tesseract.js, só dígitos) e procura a vaca no lote.
 * A biblioteca só é baixada no primeiro uso; depois fica guardada no aparelho.
 */
import type { Worker } from 'tesseract.js'

const props = defineProps<{ numeros: string[] }>()
const emit = defineEmits<{ achou: [numero: string] }>()

const arquivo = ref<HTMLInputElement>()
const lendo = ref(false)
const progresso = ref('')
const mensagem = ref('')
const opcoes = ref<string[]>([])
let worker: Worker | undefined

async function prepararWorker() {
  if (worker) return worker
  progresso.value = 'Preparando o leitor (só na primeira vez)…'
  const modulo = await import('tesseract.js')
  // Pelo empacotador o pacote às vezes chega só como default
  const { createWorker } = modulo.default ?? modulo
  worker = await createWorker('eng', 1)
  await worker.setParameters({ tessedit_char_whitelist: '0123456789' })
  return worker
}

/**
 * Tentativas em ordem, até achar um número do lote. Medido com fotos de brinco: o modo de linha
 * única ('7') com o centro recortado lê números curtos ("7", "35") que a foto inteira perde; o modo
 * esparso ('11') pega o número fora do centro. O modo vai como texto: o enum PSM não chega pela
 * importação dinâmica, e um valor indefinido faz a leitura voltar vazia.
 */
const tentativas = [
  { recorte: 0.45, modo: '7' },
  { recorte: 0.6, modo: '7' },
  { recorte: 1, modo: '7' },
  { recorte: 1, modo: '11' },
] as const

/** Centro da foto (fração do lado) com no máximo 1600 px. Sem mexer em cor: o Tesseract binariza sozinho. */
function recortar(bitmap: ImageBitmap, fracao: number): Promise<Blob> {
  const w = Math.round(bitmap.width * fracao)
  const h = Math.round(bitmap.height * fracao)
  const escala = Math.min(1, 1600 / Math.max(w, h))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(w * escala)
  canvas.height = Math.round(h * escala)
  canvas.getContext('2d')!.drawImage(bitmap, (bitmap.width - w) / 2, (bitmap.height - h) / 2, w, h, 0, 0, canvas.width, canvas.height)
  // O Tesseract lê um arquivo de imagem; um canvas direto chega em branco para ele
  return new Promise((resolve, reject) => canvas.toBlob(b => (b ? resolve(b) : reject(new Error('imagem'))), 'image/jpeg', 0.92))
}

async function ler(evento: Event) {
  const foto = (evento.target as HTMLInputElement).files?.[0]
  ;(evento.target as HTMLInputElement).value = ''
  if (!foto) return
  lendo.value = true
  mensagem.value = ''
  opcoes.value = []
  const bitmap = await createImageBitmap(foto).catch(() => undefined)
  try {
    if (!bitmap) throw new Error('foto')
    const w = await prepararWorker()
    progresso.value = 'Lendo o brinco…'
    const lidos = new Set<string>()
    let noLote: string[] = []
    for (const t of tentativas) {
      await w.setParameters({ tessedit_pageseg_mode: t.modo as never })
      const { data } = await w.recognize(await recortar(bitmap, t.recorte))
      for (const n of data.text.match(/\d{1,6}/g) ?? []) lidos.add(n)
      noLote = [...new Set([...lidos].map(n => acharNumero(n, props.numeros)).filter((n): n is string => !!n))]
      if (noLote.length) break
    }
    if (noLote.length === 1) emit('achou', noLote[0]!)
    else if (noLote.length > 1) {
      opcoes.value = noLote
      mensagem.value = 'Achei mais de um número do lote. Qual é?'
    }
    else mensagem.value = lidos.size
      ? `Li ${[...lidos].slice(0, 3).join(', ')}, mas nenhuma vaca com esse número está neste lote.`
      : 'Não consegui ler o número. Centralize o brinco na foto, com boa luz.'
  }
  catch {
    mensagem.value = navigator.onLine
      ? 'Não foi possível ler a foto. Tente de novo.'
      : 'Na primeira vez o leitor precisa de internet para ser baixado.'
  }
  finally {
    bitmap?.close()
    lendo.value = false
    progresso.value = ''
  }
}

function escolher(n: string) {
  opcoes.value = []
  mensagem.value = ''
  emit('achou', n)
}

onBeforeUnmount(() => { worker?.terminate() })
</script>

<template>
  <div class="leitor">
    <input ref="arquivo" type="file" accept="image/*" capture="environment" class="sr-only" tabindex="-1" aria-hidden="true" @change="ler">
    <button type="button" class="btn btn-contorno botao" :disabled="lendo" @click="arquivo?.click()">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
      {{ lendo ? 'Lendo…' : 'Ler brinco (foto)' }}
    </button>
    <p v-if="progresso" class="dica" role="status">{{ progresso }}</p>
    <p v-else-if="!mensagem" class="dica">Mire com o brinco no meio da foto.</p>
    <p v-if="mensagem" class="dica" role="status">{{ mensagem }}</p>
    <div v-if="opcoes.length" class="opcoes">
      <button v-for="n in opcoes" :key="n" type="button" class="btn btn-contorno" @click="escolher(n)">Vaca {{ n }}</button>
    </div>
  </div>
</template>

<style scoped>
.leitor { display: flex; flex-direction: column; gap: 8px; }
.botao { width: 100%; }
.opcoes { display: flex; gap: 8px; flex-wrap: wrap; }
</style>
