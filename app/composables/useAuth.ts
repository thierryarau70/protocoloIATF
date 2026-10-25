import type { Usuario } from '#shared/types/entidades'

const usuario = ref<Usuario | null>(null)
let carregado: Promise<void> | undefined

async function guardar(u: Usuario | null) {
  const anterior = (await bancoLocal.meta.get('usuario'))?.valor as Usuario | undefined
  // Outro veterinário neste aparelho: os dados guardados não são dele
  if (!u || (anterior && anterior.id !== u.id)) {
    await bancoLocal.transaction('rw', [...tabelasDeDados, bancoLocal.fila, bancoLocal.meta], async () => {
      await Promise.all([...tabelasDeDados, bancoLocal.fila, bancoLocal.meta].map(t => t.clear()))
    })
  }
  if (u) await bancoLocal.meta.put({ chave: 'usuario', valor: u })
  usuario.value = u
}

/** Sem internet, confia no último usuário guardado no aparelho. */
function carregar() {
  carregado ??= (async () => {
    usuario.value = ((await bancoLocal.meta.get('usuario'))?.valor as Usuario | undefined) ?? null
    if (!navigator.onLine) return
    try {
      await guardar(await api<Usuario>('/api/auth/eu'))
    }
    catch (e) {
      if ((e as { statusCode?: number })?.statusCode === 401) await guardar(null)
    }
  })()
  return carregado
}

export function useAuth() {
  return {
    usuario: readonly(usuario),
    carregar,
    async entrar(email: string, senha: string) {
      await guardar(await api<Usuario>('/api/auth/login', { method: 'POST', body: { email, senha } }))
    },
    async cadastrar(nome: string, email: string, senha: string) {
      await guardar(await api<Usuario>('/api/auth/cadastro', { method: 'POST', body: { nome, email, senha } }))
    },
    async sair() {
      await api('/api/auth/logout', { method: 'POST' }).catch(() => {})
      await guardar(null)
    },
    atualizarNome(nome: string) {
      if (usuario.value) return guardar({ ...usuario.value, nome })
    },
  }
}
