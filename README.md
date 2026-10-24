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

## Deploy (Vercel + Neon)

1. Crie o banco no Neon e copie a connection string.
2. Na Vercel, importe o repositório e defina as variáveis `DATABASE_URL` e `NUXT_SESSION_PASSWORD` (32+ caracteres).
3. O script `vercel-build` aplica as migrações (`drizzle-kit migrate`) e depois faz o build.

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

- **Sêmen** ficou como campo da propriedade (particular / misto), não como tabela separada.
- **Previsão de parto do IATF** = D10 + 283 dias (gestação média bovina).
- **Taxa de inseminação**: o total do lote é o número de vacas cadastradas no lote.
- Sem internet, datas D8/D10/D45, taxas e a lista da planilha aparecem depois da sincronização
  (são calculadas no servidor).
- **Histórico da vaca** (prenhezes, partos, abortos, perdas gestacionais, dias vazia, motivo de descarte) é
  preenchido à mão, porque inclui o que aconteceu antes do app. Fica na ficha da vaca; no cadastro rápido
  durante o DG ele não aparece. A ficha também lista os DGs e IATFs da vaca registrados no app.
- **Gráfico de sêmen** (no perfil) compara a taxa de prenhez no D45 pelo tipo de sêmen da propriedade
  (particular × misto), porque o app não registra o sêmen de cada inseminação.
- Editar o perfil precisa de internet. Logo é um endereço de imagem (sem upload de arquivos).

## Ainda não feito

- Gráficos gerais de descarte/refugo.
