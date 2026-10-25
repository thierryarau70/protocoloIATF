# Protocolo IATF

App para veterinários fazerem **DG** e **protocolo IATF** em campo, no celular, mesmo sem internet.
Feito mobile-first; em telas largas (a partir de 1024px) ganha menu lateral e layout em colunas.

Design de referência: telas "Fluxo DG + Cadastro" (cores, tipografia DM Sans, cartões, botões de 44px+).

## Stack

- Nuxt 4 (TypeScript, modo SPA para abrir offline) · deploy na Vercel
- Postgres no Neon, via Drizzle ORM (`pg`). Sem `DATABASE_URL`, usa PGlite em `.data/` (só desenvolvimento)
- Login com `nuxt-auth-utils` (sessão em cookie selado, senha com scrypt)
- PWA com `@vite-pwa/nuxt` e dados no aparelho com Dexie (IndexedDB)

## Rodar localmente

```bash
npm install
cp .env.example .env   # ajuste NUXT_SESSION_PASSWORD; DATABASE_URL é opcional em dev
npm run dev
```

Testes e tipos:

```bash
npm test          # regras de negócio e sincronização (PGlite em memória)
npm run typecheck
```

## Deploy (Vercel)

| Ambiente na Vercel | Banco (`DATABASE_URL`) |
|---|---|
| Production (`main`) | Supabase, projeto `protocolo-iatf` (São Paulo), pelo **Shared Pooler** (IPv4, porta 6543) |
| Preview (outras branches e PRs) | Neon, banco `protocolo_iatf_preview`, vazio e só para testes |

Cada ambiente tem sua própria `NUXT_SESSION_PASSWORD`. Preview nunca aponta para o banco de produção:
as migrações rodam no build, então um PR de teste mexeria nos dados reais.

1. Na Vercel, defina `DATABASE_URL` e `NUXT_SESSION_PASSWORD` (32+ caracteres) para Production e, com outros valores, para Preview.
2. No Supabase use o Shared Pooler: o pooler dedicado (`db.<ref>.supabase.co`) é só IPv6 e a Vercel não alcança.
3. O script `vercel-build` roda os testes, aplica as migrações (`server/database/migrar.mjs`, que mostra o erro se falhar) e depois faz o build: com teste falhando, nada é publicado.
4. O GitHub Actions (`.github/workflows/ci.yml`) roda tipos, testes e build em cada push e pull request.

"Esqueci a senha" só aparece com `RESEND_API_KEY` (e `EMAIL_REMETENTE`, de um domínio verificado no Resend) definida no build. Para testar local sem chave: `NUXT_PUBLIC_EMAIL_ATIVO=true npm run dev` (o e-mail sai no terminal).

Migrações novas: altere `server/database/schema.ts` e rode `npm run db:generate`.

## Arquitetura

```
componentes/páginas → composables → banco do aparelho (Dexie) + fila → /api/sync → serviços do servidor → Postgres
```

- **Componentes** não fazem HTTP nem têm regra de negócio. Chamam composables (`app/composables`).
- **Composables** leem o banco do aparelho (`useConsulta`, reativo) e gravam via `useSincronizacao().registrar()`.
- **Única saída HTTP** do app: `app/utils/api.ts`, usada só pelos composables.
- **Regras de negócio só no servidor** (`server/utils/regras.ts`): datas D8/D10/D45, quem entra no protocolo,
  justificativa obrigatória, taxas, previsão de parto. O resultado volta ao aparelho na sincronização.
- **Esquemas** de validação (zod) em `shared/esquemas.ts`, usados pelo servidor; o app usa só os tipos.

### Offline

- O service worker guarda o app; ele abre sem internet.
- Todo registro é gravado no IndexedDB e entra numa **fila** (`fila`) na mesma transação.
- Com internet, a fila é enviada **na ordem** para `POST /api/sync`. Cada operação é um upsert pelo UUID gerado
  no aparelho, então reenviar não duplica. Falha de rede → nova tentativa com espera crescente (5s até 60s).
- Depois do envio, o aparelho baixa tudo do veterinário (`GET /api/sync`) com os valores calculados no servidor.
- Aviso na tela: "Sem internet, salvo no aparelho" + quantos registros faltam; ao terminar, "Tudo sincronizado".
- Registro recusado pelo servidor (ex.: não inseminada sem justificativa) aparece num aviso vermelho.

## Telas

| Fluxo | Rota |
|---|---|
| Início (DG, IATF, Propriedades, Lotes, Perfil) | `/` |
| DG: fazenda → lote | `/dg`, `/dg/:propriedade` |
| DG + cadastro, com "DG + IATF" ou "Só DG" | `/atendimentos/:id/dg` |
| Tabela do DG (Só DG) | `/atendimentos/:id/tabela-dg` |
| Protocolo D0 / D8 / D10 / D45 | `/atendimentos/:id/protocolo` |
| Acompanhamento, resultado e tabela do lote | `/atendimentos/:id` |
| Planilha IATF por vaca | `/atendimentos/:id/planilha` |
| D45 · DG final | `/atendimentos/:id/d45` |
| Propriedades, lotes, vacas, perfil | `/propriedades`, `/lotes`, `/animais/:id`, `/perfil` |

## Decisões a confirmar

- **Previsão de parto do IATF** = D10 + 283 dias (gestação média bovina).
- **Taxa de inseminação**: o total do lote é o número de vacas cadastradas no lote.
- Sem internet, datas D8/D10/D45, taxas e a lista da planilha aparecem depois da sincronização
  (são calculadas no servidor).
- **Histórico da vaca** (prenhezes, partos, abortos, perdas gestacionais, dias vazia, motivo de descarte) é
  preenchido à mão, porque inclui o que aconteceu antes do app. Fica na ficha da vaca; no cadastro rápido
  durante o DG ele não aparece. A ficha também lista os DGs e IATFs da vaca registrados no app.
- **Cadastro de sêmen na fazenda**: na tela da propriedade, seção "Sêmen" (touro, raça, central/partida).
  Na planilha, a vaca inseminada escolhe o sêmen entre os cadastrados na fazenda (botões até 6, lista acima
  disso); dá para cadastrar um novo sem sair da planilha. O gráfico "Prenhez por sêmen" aparece no resultado
  do lote (depois do D45) e no perfil, com os 8 mais usados e o resto em "Outros". No perfil, o mesmo touro
  cadastrado em fazendas diferentes conta junto pelo nome. O tipo de sêmen (particular/misto) continua
  sendo um campo da propriedade.
- **Taxas do perfil e da propriedade** usam só IATF finalizado, porque antes do D45 a prenhez não é conhecida.
- Editar o perfil precisa de internet. Logo é um endereço de imagem (sem upload de arquivos).

## Ainda não feito

- Gráficos gerais de descarte/refugo.
