# Handoff: uso sem internet

Como o Protocolo IATF funciona no curral sem sinal: o que a pessoa precisa fazer, o que funciona
e o que não funciona offline, como o app faz isso por dentro, os limites conhecidos e como testar.

---

## 1. Resumo em uma frase

O app é guardado no celular na primeira vez que abre com internet. Daí em diante, ele abre e
registra tudo sem sinal: cada registro fica no próprio aparelho, entra numa fila e é enviado
sozinho ao servidor quando a conexão volta.

---

## 2. Para quem usa (passo a passo)

1. **Uma vez, com internet:** abrir o site, entrar na conta e deixar o app aberto por alguns
   segundos. O cartão "Instalar app" da tela inicial mostra
   *"Pronto para usar sem internet neste aparelho."* quando terminou de guardar.
2. **Instalar na tela do celular** (recomendado):
   - Android (Chrome): ⋮ → **Instalar app**.
   - iPhone (Safari): Compartilhar → **Adicionar à Tela de Início**.
3. **No curral, sem sinal:** usar normalmente. A faixa amarela no topo mostra
   *"Sem internet, salvo no aparelho. N registros para enviar quando a conexão voltar."*
4. **Quando o sinal volta:** não precisa fazer nada. A faixa muda para *"Enviando N registros…"*
   e depois *"Tudo sincronizado"*.
5. **Se algo for recusado** (ex.: vaca com nascimento hoje), aparece a faixa vermelha
   *"Não foi salvo: Vaca 202: …"*. É só corrigir e salvar de novo.

**Sair da conta** só é possível com internet e com tudo enviado. Enquanto houver registros na
fila, o botão "Sair da conta" (Perfil) fica travado e explica o motivo; com internet, aparece
"Enviar agora". Isso existe porque sair apaga os dados do aparelho.

---

## 3. O que funciona sem internet

| Funciona offline | Observação |
|---|---|
| Abrir o app e trocar de tela | Todas as telas são baixadas logo na primeira abertura com internet. |
| Propriedades, lotes, vacas, sêmen, estoque | Criar, editar e consultar. |
| DG (lista e modo curral) | Marcar prenha/vazia/descarte/refugo, idade gestacional. |
| Protocolo, planilha IATF, D45 | Hormônio, inseminação, sêmen, justificativas, resultado do D45. |
| Agenda D8/D10/D45 | As datas são calculadas no aparelho a partir do D0 enquanto o servidor não responde. |
| Leitura do brinco pela câmera | **Só depois de usar uma vez com internet** (o leitor é baixado no primeiro uso). |
| Relatório e planilha para baixar | Montados com os dados que estão no aparelho. |

| Precisa de internet | Por quê |
|---|---|
| Primeiro acesso / entrar na conta | O login é conferido no servidor. |
| Cadastro, "Esqueci a senha" | Mesma razão. |
| Sair da conta | Encerra a sessão no servidor; também exige a fila vazia. |
| Ditado por voz (na maioria dos celulares) | O reconhecimento de voz do navegador usa o servidor do Google/Apple. Sem internet o app avisa *"O ditado precisa de internet neste aparelho."* |
| Leitor de brinco na primeira vez | Baixa o leitor (Tesseract) da internet; depois fica guardado por 1 ano. |
| Taxas e resultados atualizados | Taxa de inseminação, taxa de prenhez e ranking de touros são calculados no servidor; os números novos aparecem depois que sincroniza. |
| Página de apresentação (/conheca) | Não é guardada para uso offline. |

---

## 4. Como funciona por dentro

```
 Tela (formulário, DG, planilha)
        │  salvar
        ▼
 registrar()  ── uma transação no IndexedDB (Dexie) ──┐
        │                                              │
        ├─► grava o registro na tabela local           │
        └─► coloca o registro completo na "fila"  ◄────┘
                         │
        sincronizar()  (agora, ao voltar a internet, e a cada minuto se houver fila)
                         │
        1. POST /api/sync  com até 100 itens da fila, na ordem em que foram feitos
        2. servidor valida e grava cada um (upsert pelo id gerado no aparelho)
        3. itens aceitos ou recusados saem da fila; recusados viram aviso na tela
        4. GET /api/sync  baixa tudo do servidor e substitui o que está no aparelho
           (menos o que ainda está na fila)
```

### As peças

| Peça | Arquivo | O que faz |
|---|---|---|
| Service worker (PWA) | [nuxt.config.ts](../nuxt.config.ts) (`pwa`) | Guarda JS, CSS, HTML, fontes e ícones. Qualquer endereço abre o app guardado (`navigateFallback: '/'`). Guarda o leitor de brinco do CDN no primeiro uso (`runtimeCaching`, 1 ano). Atualiza sozinho (`autoUpdate`). |
| Pré-carregamento das telas | [app/plugins/sem-internet.client.ts](../app/plugins/sem-internet.client.ts) | 2,5 s depois de abrir com internet, baixa o código de todas as telas e layouts, para trocar de tela sem sinal mesmo antes de o service worker terminar. |
| Recarregamento seguro | [app/plugins/sem-internet.client.ts](../app/plugins/sem-internet.client.ts) | Substitui o recarregamento automático do Nuxt (`emitRouteChunkError: 'manual'`). Só recarrega se `/api/auth/eu` responder em até 4 s; sem conexão de verdade, fica na tela e avisa. Versão nova publicada: atualiza na próxima troca de tela, só com internet. |
| Banco local | [app/utils/banco-local.ts](../app/utils/banco-local.ts) | IndexedDB `protocolo-iatf` (Dexie): uma tabela por entidade, mais a `fila` e a `meta` (usuário logado). |
| Fila e sincronização | [app/composables/useSincronizacao.ts](../app/composables/useSincronizacao.ts) | `registrar()` grava e enfileira na mesma transação, mesclando com o registro atual (duas alterações seguidas na mesma vaca não se apagam). `sincronizar()` envia, baixa e tenta de novo com espera crescente: 5 s, 10 s, 20 s… até 60 s. |
| Servidor | [server/utils/sincronizacao.ts](../server/utils/sincronizacao.ts) | Aplica cada operação numa transação própria, na ordem. Recusa só a operação com problema e segue com as próximas. Falha do servidor (banco fora) devolve erro e a fila fica intacta. |
| Regras de validação | [shared/esquemas.ts](../shared/esquemas.ts) | As mesmas regras rodam no formulário (antes de salvar) e no servidor; por isso quase nada é recusado depois. |
| Login offline | [app/composables/useAuth.ts](../app/composables/useAuth.ts) | Sem internet, confia no último usuário guardado no aparelho. A sessão (cookie) vale 60 dias. |
| Avisos | [app/components/AvisoSincronizacao.vue](../app/components/AvisoSincronizacao.vue) | Faixas: sem internet, enviando, tudo sincronizado, não foi salvo, sessão expirada, servidor fora. |
| Pronto para offline | [app/composables/useAvisoApp.ts](../app/composables/useAvisoApp.ts), [app/components/CartaoInstalar.vue](../app/components/CartaoInstalar.vue) | Mostra quando o service worker passou a controlar a página. |

### Garantias

- **Nada se perde por falta de sinal:** o registro só sai da fila depois que o servidor respondeu
  sobre ele (aceito ou recusado).
- **Reenviar não duplica:** cada registro tem um id gerado no aparelho e o servidor faz upsert por
  ele.
- **Ordem preservada:** a fila é enviada na ordem em que as coisas foram feitas (a fazenda antes do
  lote, o lote antes da vaca).
- **Outro veterinário no mesmo aparelho:** ao entrar com outra conta, os dados guardados do anterior
  são apagados do aparelho.

---

## 5. Limites conhecidos

1. **Dois aparelhos editando a mesma vaca offline:** vale o último que sincronizar (o registro é
   enviado completo). Não há mesclagem campo a campo.
2. **Sair da conta é bloqueado** enquanto houver itens na fila ou sem internet
   ([app/pages/perfil.vue](../app/pages/perfil.vue) e `sair()` em
   [app/composables/useAuth.ts](../app/composables/useAuth.ts)), porque sair apaga os dados do
   aparelho. Fechar o navegador ou limpar os dados do site pelo sistema continua fora do controle
   do app.
3. **Registro recusado volta ao que está no servidor.** Ao baixar os dados, o aparelho fica igual
   ao servidor; uma vaca nova recusada some da lista (o aviso vermelho diz qual e por quê).
4. **Taxas só depois de sincronizar.** Resultado do atendimento, painel da fazenda e ranking de
   touros usam números calculados no servidor.
5. **Ditado por voz depende do navegador.** Na maioria dos celulares precisa de internet.
6. **iPhone pode apagar o armazenamento** de sites pouco usados (regra do Safari). Instalado na
   tela de início, isso é bem mais raro. Mesmo assim, sincronizar com frequência é o seguro.
7. **Sessão de 60 dias.** Se expirar, a faixa pede para entrar de novo; a fila espera até lá.

---

## 6. Como testar

**No navegador do computador (Chrome):**

1. `npm run build && node .output/server/index.mjs` (o service worker não roda em `npm run dev`).
2. Abrir, entrar e esperar *"Pronto para usar sem internet"*.
3. DevTools → Network → **Offline**.
4. Recarregar a página, trocar de telas, cadastrar uma vaca, marcar um DG.
5. Conferir a faixa *"Sem internet, salvo no aparelho. N registros…"* e, em DevTools →
   Application → IndexedDB → `protocolo-iatf` → `fila`, os itens esperando.
6. Voltar para **Online**: a faixa vira *"Enviando…"* e depois *"Tudo sincronizado"*; a `fila`
   esvazia.

**No celular:** instalar o app, abrir uma vez com internet, ligar o modo avião, usar, desligar o
modo avião e conferir a sincronização.

**Testes automáticos:** `npx vitest run` cobre o servidor da sincronização
([tests/sincronizacao.test.ts](../tests/sincronizacao.test.ts)): ordem, reenvio sem duplicar,
recusa com motivo sem travar a fila, permissões entre veterinários.
