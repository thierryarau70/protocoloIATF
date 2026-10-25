<script setup lang="ts">
const { perfil, erro, carregar, salvar } = usePerfil()
const { sair } = useAuth()
const { online, pendentes } = useSincronizacao()

const form = reactive({ nome: '', crmv: '', empresa: '', local: '', logoUrl: '', contato: '' })
const mensagem = ref('')
const salvando = ref(false)
const carregado = ref(false)

onMounted(async () => {
  await carregar()
  if (perfil.value) {
    const { nome, crmv, empresa, local, logoUrl, contato } = perfil.value
    Object.assign(form, { nome, crmv: crmv ?? '', empresa: empresa ?? '', local: local ?? '', logoUrl: logoUrl ?? '', contato: contato ?? '' })
  }
  // Só mostra o formulário depois de preenchido, para não apagar o que já foi digitado
  carregado.value = true
})

async function enviar() {
  mensagem.value = ''
  salvando.value = true
  try {
    await salvar({ ...form })
    mensagem.value = 'Perfil salvo.'
  }
  catch (e) {
    mensagem.value = mensagemDeErro(e, 'Não foi possível salvar o perfil.')
  }
  finally {
    salvando.value = false
  }
}

async function confirmarSaida() {
  const aviso = pendentes.value
    ? `Há ${plural(pendentes.value, 'registro', 'registros')} ainda não enviados. Se sair agora, eles serão perdidos. Sair mesmo assim?`
    : 'Sair da conta neste aparelho?'
  if (!confirm(aviso)) return
  await sair()
  await navigateTo('/entrar')
}

const graficoSemen = computed(() => itensGraficoSemen(perfil.value?.resumo.semen ?? []))

const graficoAnos = computed(() => (perfil.value?.resumo.iatfPorAno ?? []).map(a => ({ rotulo: String(a.ano), valor: a.total })))
</script>

<template>
  <AppTela titulo="Perfil" sobrelinha="Veterinário" :voltar="{ to: '/', rotulo: 'Início' }" larga>
    <div class="colunas">
      <section class="pilha-curta">
        <h2 class="titulo-secao">Resumo</h2>
        <div class="estatisticas">
          <div class="cartao"><Estatistica :valor="perfil?.resumo.propriedades ?? '—'" rotulo="Propriedades" tom="plano" /></div>
          <div class="cartao"><Estatistica :valor="formatarTaxa(perfil?.resumo.taxaPrenhez)" rotulo="Taxa de prenhez" tom="plano" /></div>
        </div>
        <div class="cartao">
          <GraficoBarras v-if="graficoAnos.length" titulo="IATF por ano" :itens="graficoAnos" />
          <p v-else class="dica">Os protocolos IATF aparecem aqui por ano.</p>
        </div>
        <div class="cartao">
          <GraficoTaxa
            v-if="graficoSemen.length" titulo="Prenhez por sêmen" :itens="graficoSemen"
            descricao="Taxa no D45 entre as vacas inseminadas com cada sêmen, nos IATF finalizados."
          />
          <p v-else class="dica">A comparação por sêmen aparece aqui depois do primeiro IATF finalizado com o sêmen registrado na planilha.</p>
        </div>
        <p v-if="erro" class="dica">{{ erro }}</p>
        <CartaoInstalar />
      </section>

      <form v-if="carregado" class="pilha" @submit.prevent="enviar">
        <h2 class="titulo-secao">Dados</h2>
        <img v-if="form.logoUrl" :src="form.logoUrl" alt="Logo" class="logo">
        <div class="campo">
          <label for="nome">Nome</label>
          <input id="nome" v-model="form.nome" class="entrada" required>
        </div>
        <div class="linha-campos">
          <div class="campo">
            <label for="crmv">CRMV</label>
            <input id="crmv" v-model="form.crmv" class="entrada">
          </div>
          <div class="campo">
            <label for="empresa">Empresa</label>
            <input id="empresa" v-model="form.empresa" class="entrada">
          </div>
        </div>
        <div class="campo">
          <label for="local">Local</label>
          <input id="local" v-model="form.local" class="entrada">
        </div>
        <div class="campo">
          <label for="contato">E-mail / contato</label>
          <input id="contato" v-model="form.contato" class="entrada">
        </div>
        <div class="campo">
          <label for="logo">Endereço da logo (imagem)</label>
          <input id="logo" v-model="form.logoUrl" class="entrada" type="url" placeholder="https://">
        </div>
        <p v-if="!online" class="dica">Editar o perfil precisa de internet.</p>
        <p v-if="mensagem" class="dica" role="status">{{ mensagem }}</p>
        <button type="submit" class="btn btn-primario btn-bloco" :disabled="!online || salvando">Salvar perfil</button>
        <button type="button" class="btn btn-perigo btn-bloco" @click="confirmarSaida">
          <Icone nome="sair" />
          Sair da conta
        </button>
      </form>
    </div>
  </AppTela>
</template>

<style scoped>
.colunas { display: flex; flex-direction: column; gap: 24px; }
.estatisticas { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.estatisticas .cartao { padding: 6px; }
.logo { max-width: 160px; max-height: 80px; object-fit: contain; }

@media (min-width: 1024px) {
  .colunas { display: grid; grid-template-columns: 2fr 3fr; align-items: start; }
}
</style>
