const publicas = ['/entrar', '/cadastro']

export default defineNuxtRouteMiddleware(async (to) => {
  const { usuario, carregar } = useAuth()
  await carregar()
  if (!usuario.value && !publicas.includes(to.path)) return navigateTo('/entrar')
  if (usuario.value && publicas.includes(to.path)) return navigateTo('/')
  if (usuario.value) useSincronizacao().iniciar()
})
