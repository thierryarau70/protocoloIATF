<script setup lang="ts">
definePageMeta({ layout: 'vazio' })

const { cadastrar } = useAuth()
const nome = ref('')
const email = ref('')
const senha = ref('')
const erro = ref('')
const enviando = ref(false)

async function enviar() {
  erro.value = ''
  enviando.value = true
  try {
    await cadastrar(nome.value, email.value, senha.value)
    await navigateTo('/perfil')
  }
  catch (e) {
    erro.value = mensagemDeErro(e, 'Não foi possível criar a conta.')
  }
  finally {
    enviando.value = false
  }
}
</script>

<template>
  <TelaAcesso titulo="Criar conta" botao="Criar conta" :erro="erro" :enviando="enviando" @enviar="enviar">
    <div class="campo">
      <label for="nome">Nome</label>
      <input id="nome" v-model="nome" class="entrada" autocomplete="name" required>
    </div>
    <div class="campo">
      <label for="email">E-mail</label>
      <input id="email" v-model="email" class="entrada" type="email" autocomplete="email" required>
    </div>
    <div class="campo">
      <label for="senha">Senha (mínimo 8 caracteres)</label>
      <input id="senha" v-model="senha" class="entrada" type="password" autocomplete="new-password" minlength="8" required>
    </div>
    <template #rodape>
      <NuxtLink to="/entrar" class="btn btn-bloco">Já tenho conta</NuxtLink>
    </template>
  </TelaAcesso>
</template>
