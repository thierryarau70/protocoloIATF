<script setup lang="ts">
definePageMeta({ layout: 'vazio' })

const { entrar } = useAuth()
const email = ref('')
const senha = ref('')
const erro = ref('')
const enviando = ref(false)

async function enviar() {
  erro.value = ''
  if (!navigator.onLine) {
    erro.value = 'Para entrar pela primeira vez é preciso internet.'
    return
  }
  enviando.value = true
  try {
    await entrar(email.value, senha.value)
    await navigateTo('/')
  }
  catch (e) {
    erro.value = mensagemDeErro(e, 'Não foi possível entrar.')
  }
  finally {
    enviando.value = false
  }
}
</script>

<template>
  <TelaAcesso titulo="Entrar" botao="Entrar" :erro="erro" :enviando="enviando" @enviar="enviar">
    <div class="campo">
      <label for="email">E-mail</label>
      <input id="email" v-model="email" class="entrada" type="email" autocomplete="email" required>
    </div>
    <div class="campo">
      <label for="senha">Senha</label>
      <input id="senha" v-model="senha" class="entrada" type="password" autocomplete="current-password" required>
    </div>
    <template #rodape>
      <NuxtLink to="/cadastro" class="btn btn-bloco">Criar conta de veterinário</NuxtLink>
    </template>
  </TelaAcesso>
</template>
