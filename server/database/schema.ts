import { boolean, date, integer, numeric, pgTable, text, time, timestamp, unique, uuid } from 'drizzle-orm/pg-core'

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

export const animal = pgTable('animal', {
  id: uuid('id').primaryKey(),
  loteId: uuid('lote_id').notNull().references(() => lote.id, { onDelete: 'cascade' }),
  numero: text('numero').notNull(),
  nascimento: date('nascimento'),
  peso: numeric('peso', { mode: 'number' }),
  raca: text('raca'),
  previsaoParto: date('previsao_parto'),
  touroPrenhez: text('touro_prenhez'),
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
  obs: text('obs'),
  resultadoD45: text('resultado_d45', { enum: ['prenha', 'vazia'] }),
  atualizadoEm: atualizadoEm(),
}, t => [unique().on(t.atendimentoId, t.animalId)])
