<script setup lang="ts">
definePageMeta({ layout: 'vazio' })

const { esqueci } = useAuth()
const email = ref('')
const erro = ref('')
const enviando = ref(false)
const enviado = ref(false)

async function enviar() {
  erro.value = ''
  if (!navigator.onLine) {
    erro.value = 'Para receber o link é preciso internet.'
    return
  }
  enviando.value = true
  try {
    await esqueci(email.value)
    enviado.value = true
  }
  catch (e) {
    erro.value = mensagemDeErro(e, 'Não foi possível enviar o link.')
  }
  finally {
    enviando.value = false
  }
}
</script>

<template>
  <TelaAcesso titulo="Esqueci a senha" :botao="enviado ? 'Enviar de novo' : 'Enviar link'" :erro="erro" :enviando="enviando" @enviar="enviar">
    <p v-if="!enviado" class="dica">Digite o e-mail da sua conta. Vamos mandar um link para você criar uma senha nova.</p>
    <p v-else class="cartao-suave" role="status">
      Se houver uma conta com <strong>{{ email }}</strong>, o link chega em instantes. Ele vale por 1 hora.
      Não achou? Olhe a caixa de spam.
    </p>
    <div class="campo">
      <label for="email">E-mail</label>
      <input id="email" v-model="email" class="entrada" type="email" autocomplete="email" required>
    </div>
    <template #rodape>
      <NuxtLink to="/entrar" class="btn btn-bloco">Voltar para entrar</NuxtLink>
    </template>
  </TelaAcesso>
</template>
