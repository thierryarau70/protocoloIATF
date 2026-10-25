<script setup lang="ts">
definePageMeta({ layout: 'vazio' })

const route = useRoute()
const { redefinir } = useAuth()
const token = String(route.query.token ?? '')
const senha = ref('')
const confirmacao = ref('')
const erro = ref(token ? '' : 'Link incompleto. Abra de novo o link do e-mail ou peça outro em "Esqueci a senha".')
const enviando = ref(false)

async function enviar() {
  erro.value = ''
  if (!token) {
    erro.value = 'Link incompleto. Abra de novo o link do e-mail ou peça outro em "Esqueci a senha".'
    return
  }
  if (senha.value !== confirmacao.value) {
    erro.value = 'As duas senhas não são iguais.'
    return
  }
  enviando.value = true
  try {
    await redefinir(token, senha.value)
    await navigateTo('/', { replace: true })
  }
  catch (e) {
    erro.value = mensagemDeErro(e, 'Não foi possível trocar a senha.')
  }
  finally {
    enviando.value = false
  }
}
</script>

<template>
  <TelaAcesso titulo="Criar senha nova" botao="Salvar senha e entrar" :erro="erro" :enviando="enviando" @enviar="enviar">
    <div class="campo">
      <label for="senha">Senha nova (mínimo 8 caracteres)</label>
      <input id="senha" v-model="senha" class="entrada" type="password" autocomplete="new-password" minlength="8" required>
    </div>
    <div class="campo">
      <label for="confirmacao">Repita a senha nova</label>
      <input id="confirmacao" v-model="confirmacao" class="entrada" type="password" autocomplete="new-password" minlength="8" required>
    </div>
    <template #rodape>
      <NuxtLink to="/esqueci" class="btn btn-bloco">Pedir outro link</NuxtLink>
    </template>
  </TelaAcesso>
</template>
