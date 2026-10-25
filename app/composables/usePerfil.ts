import type { DadosPerfil, Perfil } from '#shared/types/entidades'

/** Perfil vem do servidor; a última versão fica no aparelho para abrir sem internet. */
export function usePerfil() {
  const perfil = ref<Perfil | null>(null)
  const erro = ref('')

  async function carregar() {
    perfil.value = ((await bancoLocal.meta.get('perfil'))?.valor as Perfil | undefined) ?? null
    if (!navigator.onLine) return
    try {
      perfil.value = await api<Perfil>('/api/perfil')
      await bancoLocal.meta.put({ chave: 'perfil', valor: toRaw(perfil.value) })
    }
    catch (e) {
      erro.value = mensagemDeErro(e, 'Não foi possível atualizar o perfil.')
    }
  }

  async function salvar(dados: DadosPerfil) {
    await api('/api/perfil', { method: 'PUT', body: dados })
    await useAuth().atualizarNome(dados.nome)
    await carregar()
  }

  return { perfil, erro, carregar, salvar }
}
