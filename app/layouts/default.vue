<script setup lang="ts">
const { usuario } = useAuth()
const { online, pendentes } = useSincronizacao()

const links = [
  { to: '/', rotulo: 'Início', icone: 'inicio' },
  { to: '/propriedades', rotulo: 'Propriedades', icone: 'fazenda' },
  { to: '/lotes', rotulo: 'Lotes', icone: 'lote' },
  { to: '/dg', rotulo: 'Novo DG', icone: 'dg' },
  { to: '/iatf', rotulo: 'IATF', icone: 'iatf' },
  { to: '/perfil', rotulo: 'Perfil', icone: 'perfil' },
] as const

const route = useRoute()
const ativo = (to: string) => (to === '/' ? route.path === '/' : route.path.startsWith(to))

// Indicador que desliza até o link ativo (só aparece na barra lateral do desktop)
const menu = ref<HTMLElement>()
const indicador = ref<{ top: number, height: number } | null>(null)
function posicionar() {
  const link = menu.value?.querySelector<HTMLElement>('.link.ativo')
  indicador.value = link?.offsetHeight ? { top: link.offsetTop, height: link.offsetHeight } : null
}
watch(() => route.path, () => nextTick(posicionar))
let observador: ResizeObserver | undefined
onMounted(() => {
  posicionar()
  observador = new ResizeObserver(posicionar)
  if (menu.value) observador.observe(menu.value)
})
onBeforeUnmount(() => observador?.disconnect())
</script>

<template>
  <div class="app">
    <nav class="lateral" aria-label="Principal">
      <NuxtLink to="/" class="marca">
        <img src="/icon.svg" alt="" width="36" height="36">
        <span>Protocolo IATF</span>
      </NuxtLink>
      <ul ref="menu">
        <li
          v-if="indicador"
          class="indicador"
          aria-hidden="true"
          :style="{ transform: `translateY(${indicador.top}px)`, height: `${indicador.height}px` }"
        />
        <li v-for="l in links" :key="l.to">
          <NuxtLink :to="l.to" class="link" :class="{ ativo: ativo(l.to) }" :aria-current="ativo(l.to) ? 'page' : undefined">
            <Icone :nome="l.icone" />
            {{ l.rotulo }}
          </NuxtLink>
        </li>
      </ul>
      <div class="rodape-lateral">
        <div class="estado" :class="{ offline: !online }">
          <Icone :nome="online ? 'nuvem' : 'sem-rede'" :tamanho="16" />
          <span v-if="!online">Sem internet</span>
          <span v-else-if="pendentes">Enviando {{ pendentes }}</span>
          <span v-else>Sincronizado</span>
        </div>
        <div class="usuario">{{ usuario?.nome }}</div>
      </div>
    </nav>
    <div class="conteudo">
      <slot />
    </div>
  </div>
</template>

<style scoped>
.lateral { display: none; }

@media (min-width: 1024px) {
  .app { display: grid; grid-template-columns: 248px 1fr; min-height: 100dvh; }
  .lateral {
    display: flex; flex-direction: column; gap: 20px; position: sticky; top: 0; height: 100dvh;
    padding: 24px 16px; background: var(--superficie); border-right: 1px solid var(--borda);
  }
  .marca { display: flex; align-items: center; gap: 10px; font-size: 17px; font-weight: 700; padding: 0 8px; }
  ul { position: relative; list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .indicador {
    position: absolute; top: 0; left: 0; right: 0; border-radius: 10px; background: var(--primaria-suave);
    transition: transform var(--medio) var(--curva), height var(--medio) var(--curva);
  }
  .link {
    position: relative; z-index: 1; display: flex; align-items: center; gap: 12px; min-height: 44px; padding: 0 12px; border-radius: 10px;
    font-size: 15px; font-weight: 500; color: var(--texto-2); transition: background-color var(--rapido), color var(--rapido);
  }
  .link:hover:not(.ativo) { background: var(--superficie-2); }
  .ativo { color: var(--primaria); font-weight: 700; }
  .link :deep(.icone) { transition: transform var(--medio) var(--curva); }
  .link:hover :deep(.icone) { transform: translateX(2px); }
  .rodape-lateral { margin-top: auto; display: flex; flex-direction: column; gap: 8px; padding: 0 8px; }
  .estado { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: var(--primaria); }
  .estado.offline { color: var(--ambar); }
  .usuario { font-size: 14px; font-weight: 700; }
  .conteudo { min-width: 0; }
}
</style>
