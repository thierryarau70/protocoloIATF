<script setup lang="ts">
const { usuario } = useAuth()
const { atendimentos } = useAtendimentos()
const emAndamento = computed(() => atendimentos.value.filter(a => a.status !== 'finalizado').slice(0, 5))

const atalhos = [
  { to: '/dg', titulo: 'DG', texto: 'Novo atendimento: fazenda, lote e diagnóstico', icone: 'dg', destaque: true },
  { to: '/iatf', titulo: 'IATF', texto: 'Protocolos em andamento e resultados', icone: 'iatf' },
  { to: '/propriedades', titulo: 'Propriedades', texto: 'Fazendas, sêmen e resumo', icone: 'fazenda' },
  { to: '/lotes', titulo: 'Lotes', texto: 'Lotes e vacas, com busca', icone: 'lote' },
] as const

function link(a: { id: string, status: string }) {
  return a.status === 'dg' ? `/atendimentos/${a.id}/dg` : `/atendimentos/${a.id}`
}
</script>

<template>
  <AppTela :titulo="`Olá, ${usuario?.nome?.split(' ')[0] ?? ''}`" sobrelinha="Protocolo IATF">
    <template #acao>
      <NuxtLink to="/perfil" class="perfil-link">
        <Icone nome="perfil" />
        Perfil
      </NuxtLink>
    </template>

    <div class="pilha">
      <CartaoInstalar dispensavel />
      <AgendaManejos />
      <div class="atalhos">
        <NuxtLink v-for="a in atalhos" :key="a.to" :to="a.to" class="atalho cascata" :class="{ destaque: 'destaque' in a }">
          <span class="atalho-icone"><Icone :nome="a.icone" :tamanho="24" /></span>
          <span class="atalho-titulo">{{ a.titulo }}</span>
          <span class="atalho-texto">{{ a.texto }}</span>
        </NuxtLink>
      </div>

      <section v-if="emAndamento.length" class="pilha-curta">
        <h2 class="titulo-secao">Em andamento</h2>
        <ItemLista
          v-for="a in emAndamento" :key="a.id" :to="link(a)"
          :titulo="`${a.propriedade} · ${a.lote}`"
          :subtitulo="`D0 ${formatarData(a.dataD0)} · ${a.status === 'dg' ? 'Continuar DG' : 'Protocolo em andamento'}`"
        />
      </section>
    </div>
  </AppTela>
</template>

<style scoped>
.perfil-link { display: inline-flex; align-items: center; gap: 6px; min-height: 44px; font-size: 14px; font-weight: 500; color: var(--primaria); }
.atalhos { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.atalho { display: flex; flex-direction: column; gap: 6px; min-height: 132px; padding: 16px; background: var(--superficie); border: 1px solid var(--borda); border-radius: var(--raio-grande); }
.atalho { transition: border-color var(--rapido), box-shadow var(--rapido), transform var(--rapido) var(--curva); }
.atalho:hover { border-color: var(--primaria); box-shadow: 0 8px 22px rgb(27 42 34 / .1); transform: translateY(-2px); }
.atalho:active { transform: scale(.98); }
.atalho-icone { width: 44px; height: 44px; display: flex; align-items: center; justify-content: center; border-radius: 12px; background: var(--primaria-suave); color: var(--primaria); margin-bottom: 4px; transition: transform var(--medio) var(--curva); }
.atalho:hover .atalho-icone { transform: scale(1.08) rotate(-4deg); }
.atalho-titulo { font-size: 18px; font-weight: 700; }
.atalho-texto { font-size: 13px; color: var(--texto-suave); line-height: 1.35; }
.destaque { background: var(--primaria); border-color: var(--primaria); color: #FFFFFF; }
.destaque .atalho-icone { background: rgba(255, 255, 255, .16); color: #FFFFFF; }
.destaque .atalho-texto { color: #DCEBE2; }

@media (min-width: 720px) {
  .atalhos { grid-template-columns: repeat(4, 1fr); }
}
@media (min-width: 1024px) {
  .perfil-link { display: none; }
}
</style>
