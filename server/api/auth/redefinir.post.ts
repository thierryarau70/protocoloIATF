import { esquemaRedefinir } from '#shared/esquemas'

export default defineEventHandler(async (event) => {
  const { token, senha } = await readValidatedBody(event, esquemaRedefinir.parse)
  const porIp = limites.redefinirIp(getRequestIP(event, { xForwardedFor: true }) ?? 'desconhecido')
  await exigirDentroDoLimite(porIp)
  await registrarTentativa([porIp.chave])

  const vet = await redefinirSenha(token, await hashPassword(senha))
  // Senha nova: as falhas de login antigas deste e-mail não contam mais
  await limparTentativas(limites.loginEmail(vet.email).chave)
  await setUserSession(event, { user: vet })
  return vet
})
