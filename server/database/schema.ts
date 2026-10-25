import { boolean, date, index, integer, numeric, pgTable, text, time, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

const atualizadoEm = () => timestamp('atualizado_em', { withTimezone: true }).notNull().defaultNow()

export const veterinario = pgTable('veterinario', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  senhaHash: text('senha_hash').notNull(),
  nome: text('nome').notNull(),
  crmv: text('crmv'),
  empresa: text('empresa'),
  local: text('local'),
  logoUrl: text('logo_url'),
  contato: text('contato'),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
})

export const propriedade = pgTable('propriedade', {
  id: uuid('id').primaryKey(),
  veterinarioId: uuid('veterinario_id').notNull().references(() => veterinario.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  proprietario: text('proprietario'),
  local: text('local'),
  inscricao: text('inscricao'),
  semenTipo: text('semen_tipo', { enum: ['particular', 'misto'] }),
  atualizadoEm: atualizadoEm(),
})

export const lote = pgTable('lote', {
  id: uuid('id').primaryKey(),
  propriedadeId: uuid('propriedade_id').notNull().references(() => propriedade.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  localPrincipal: text('local_principal'),
  atualizadoEm: atualizadoEm(),
})

// Sêmen cadastrado na fazenda; a planilha escolhe daqui o sêmen de cada vaca inseminada
export const semen = pgTable('semen', {
  id: uuid('id').primaryKey(),
  propriedadeId: uuid('propriedade_id').notNull().references(() => propriedade.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  raca: text('raca'),
  partida: text('partida'),
  // Estoque: doses contadas em estoqueEm; o restante desconta as inseminações desde então
  estoqueDoses: integer('estoque_doses'),
  estoqueEm: date('estoque_em'),
  estoqueMinimo: integer('estoque_minimo'),
  atualizadoEm: atualizadoEm(),
})

// Hormônios e implantes do veterinário. Saldo contado em saldoEm; o restante desconta
// usoPorVaca por vaca que entrou em protocolo IATF desde então
export const insumo = pgTable('insumo', {
  id: uuid('id').primaryKey(),
  veterinarioId: uuid('veterinario_id').notNull().references(() => veterinario.id, { onDelete: 'cascade' }),
  nome: text('nome').notNull(),
  unidade: text('unidade').notNull(),
  saldo: numeric('saldo', { mode: 'number' }).notNull(),
  saldoEm: date('saldo_em').notNull(),
  usoPorVaca: numeric('uso_por_vaca', { mode: 'number' }),
  minimo: numeric('minimo', { mode: 'number' }),
  atualizadoEm: atualizadoEm(),
})

export const animal = pgTable('animal', {
  id: uuid('id').primaryKey(),
  loteId: uuid('lote_id').notNull().references(() => lote.id, { onDelete: 'cascade' }),
  numero: text('numero').notNull(),
  nascimento: date('nascimento'),
  peso: numeric('peso', { mode: 'number' }),
  raca: text('raca'),
  previsaoParto: date('previsao_parto'),
  touroPrenhez: text('touro_prenhez'),
  // Histórico informado pelo veterinário (inclui o que aconteceu antes do app)
  numPrenhezes: integer('num_prenhezes'),
  numAbortos: integer('num_abortos'),
  numPerdasGestacionais: integer('num_perdas_gestacionais'),
  numPartos: integer('num_partos'),
  diasVazia: integer('dias_vazia'),
  motivoDescarte: text('motivo_descarte', { enum: ['saude_uterina', 'cisto', 'defeito_congenito'] }),
  atualizadoEm: atualizadoEm(),
})

export const atendimento = pgTable('atendimento', {
  id: uuid('id').primaryKey(),
  loteId: uuid('lote_id').notNull().references(() => lote.id, { onDelete: 'cascade' }),
  tipo: text('tipo', { enum: ['dg_iatf', 'so_dg'] }).notNull(),
  status: text('status', { enum: ['dg', 'protocolo', 'finalizado'] }).notNull().default('dg'),
  dataD0: date('data_d0').notNull(),
  // Calculadas no servidor a partir do D0
  dataD8: date('data_d8').notNull(),
  dataD10: date('data_d10').notNull(),
  dataD45: date('data_d45').notNull(),
  gnrh: boolean('gnrh'),
  horaD8: time('hora_d8'),
  horaD10: time('hora_d10'),
  inseminador: text('inseminador'),
  animaisPerdidos: integer('animais_perdidos').notNull().default(0),
  atualizadoEm: atualizadoEm(),
})

export const atendimentoAnimal = pgTable('atendimento_animal', {
  id: uuid('id').primaryKey(),
  atendimentoId: uuid('atendimento_id').notNull().references(() => atendimento.id, { onDelete: 'cascade' }),
  animalId: uuid('animal_id').notNull().references(() => animal.id, { onDelete: 'cascade' }),
  situacaoDg: text('situacao_dg', { enum: ['pendente', 'prenha', 'vazia', 'descarte', 'refugo'] }).notNull().default('pendente'),
  idadeGestacional: text('idade_gestacional'),
  destinoDescarte: text('destino_descarte'),
  motivoRefugo: text('motivo_refugo'),
  // Calculado no servidor: só vaca vazia em atendimento DG + IATF entra no protocolo
  emProtocolo: boolean('em_protocolo').notNull().default(false),
  hormonioDia: text('hormonio_dia', { enum: ['d7', 'd8', 'd9'] }),
  inseminada: boolean('inseminada'),
  justificativaNaoInseminada: text('justificativa_nao_inseminada'),
  semenId: uuid('semen_id').references(() => semen.id, { onDelete: 'set null' }),
  obs: text('obs'),
  resultadoD45: text('resultado_d45', { enum: ['prenha', 'vazia'] }),
  atualizadoEm: atualizadoEm(),
}, t => [unique().on(t.atendimentoId, t.animalId)])

// Tentativas de login e cadastro, para limitar força bruta (ex.: "login:email:ana@x.com", "cadastro:ip:1.2.3.4")
export const tentativaAcesso = pgTable('tentativa_acesso', {
  id: uuid('id').primaryKey().defaultRandom(),
  chave: text('chave').notNull(),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
}, t => [index('tentativa_acesso_chave_criado_em_idx').on(t.chave, t.criadoEm)])

// Links de "Esqueci a senha": só o hash do token fica no banco; vale 1 hora e uma vez
export const redefinicaoSenha = pgTable('redefinicao_senha', {
  id: uuid('id').primaryKey().defaultRandom(),
  veterinarioId: uuid('veterinario_id').notNull().references(() => veterinario.id, { onDelete: 'cascade' }),
  tokenHash: text('token_hash').notNull().unique(),
  expiraEm: timestamp('expira_em', { withTimezone: true }).notNull(),
  usadoEm: timestamp('usado_em', { withTimezone: true }),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
})
