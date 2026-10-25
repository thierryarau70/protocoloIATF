import { esquemaEsqueci } from '#shared/esquemas'

const escapar = (s: string) => s.replace(/[&<>"']/g, c => `&#${c.charCodeAt(0)};`)

export default defineEventHandler(async (event) => {
  if (!useRuntimeConfig(event).public.emailAtivo) throw createError({ statusCode: 503, message: 'A recuperação de senha por e-mail ainda não está disponível. Fale com o suporte.' })
  const { email } = await readValidatedBody(event, esquemaEsqueci.parse)
  const porEmail = limites.esqueciEmail(email)
  const porIp = limites.esqueciIp(getRequestIP(event, { xForwardedFor: true }) ?? 'desconhecido')
  await exigirDentroDoLimite(porEmail, porIp)
  await registrarTentativa([porEmail.chave, porIp.chave])

  const pedido = await criarRedefinicao(email)
  if (pedido) {
    const link = `${urlDoApp(getRequestURL(event).origin)}/redefinir?token=${pedido.token}`
    const nome = pedido.nome.split(' ')[0] ?? ''
    await enviarEmail({
      para: email,
      assunto: 'Redefinir sua senha do Protocolo IATF',
      texto: `Olá, ${nome}.\n\nPara criar uma senha nova, abra o link abaixo (vale por ${pedido.validadeMin} minutos e uma vez só):\n${link}\n\nSe não foi você que pediu, ignore este e-mail: sua senha continua a mesma.`,
      html: `<p>Olá, ${escapar(nome)}.</p><p>Para criar uma senha nova, toque no botão abaixo. O link vale por ${pedido.validadeMin} minutos e uma vez só.</p>`
        + `<p><a href="${link}" style="display:inline-block;padding:12px 20px;background:#1F5C45;color:#fff;border-radius:10px;text-decoration:none;font-weight:700">Criar senha nova</a></p>`
        + `<p style="color:#5B6B60;font-size:13px">Se não foi você que pediu, ignore este e-mail: sua senha continua a mesma.</p>`,
    })
  }
  // Mesma resposta com ou sem conta: não revela quais e-mails estão cadastrados
  return { ok: true }
})
