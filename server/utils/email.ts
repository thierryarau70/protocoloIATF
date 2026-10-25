interface Email { para: string, assunto: string, texto: string, html: string }

/**
 * Envia pelo Resend (RESEND_API_KEY e EMAIL_REMETENTE). Sem a chave, em desenvolvimento mostra o
 * e-mail no terminal; em produção registra o erro. Nunca falha para quem pediu, para não revelar
 * se o e-mail tem conta.
 */
export async function enviarEmail({ para, assunto, texto, html }: Email) {
  const chave = process.env.RESEND_API_KEY
  const remetente = process.env.EMAIL_REMETENTE || 'Protocolo IATF <onboarding@resend.dev>'
  if (!chave) {
    if (import.meta.dev) console.info(`[e-mail para ${para}] ${assunto}\n${texto}`)
    else console.error('RESEND_API_KEY não definida: e-mail não enviado.')
    return
  }
  try {
    const resposta = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${chave}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: remetente, to: [para], subject: assunto, text: texto, html }),
    })
    if (!resposta.ok) console.error(`Resend recusou o e-mail (${resposta.status}): ${(await resposta.text()).slice(0, 300)}`)
  }
  catch (e) {
    console.error('Falha ao chamar o Resend:', (e as Error).message)
  }
}

/** Endereço público do app para os links dos e-mails. */
export function urlDoApp(origemDaRequisicao: string) {
  if (process.env.NUXT_URL_APP) return process.env.NUXT_URL_APP.replace(/\/$/, '')
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`
  return origemDaRequisicao
}
