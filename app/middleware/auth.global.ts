const publicas = ['/entrar', '/cadastro', '/esqueci', '/redefinir']
/** Abertas para todos, com ou sem login */
const abertas = ['/conheca']

export default defineNuxtRouteMiddleware(async (to) => {
  const { usuario, carregar } = useAuth()
  await carregar()
  if (abertas.includes(to.path)) return
  // Quem chega ao endereço do site sem conta vê a apresentação do app
  if (!usuario.value && to.path === '/') return navigateTo('/conheca')
  if (!usuario.value && !publicas.includes(to.path)) return navigateTo('/entrar')
  if (usuario.value && publicas.includes(to.path)) return navigateTo('/')
  if (usuario.value) useSincronizacao().iniciar()
})
