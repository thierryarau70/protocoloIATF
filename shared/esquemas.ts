import { z } from 'zod'

const textoOpcional = z.string().trim().max(200).nullish().transform(v => v || null)
const data = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
const dataOpcional = data.nullish().transform(v => v || null)
const contagem = z.number().int().min(0).max(10000).nullish().transform(v => v ?? null)
const hora = z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullish().transform(v => v || null)

export const esquemaPropriedade = z.object({
  id: z.uuid(),
  nome: z.string().trim().min(1).max(120),
  proprietario: textoOpcional,
  local: textoOpcional,
  inscricao: textoOpcional,
  semenTipo: z.enum(['particular', 'misto']).nullish().transform(v => v ?? null),
})

export const esquemaLote = z.object({
  id: z.uuid(),
  propriedadeId: z.uuid(),
  nome: z.string().trim().min(1).max(120),
  localPrincipal: textoOpcional,
})

export const esquemaSemen = z.object({
  id: z.uuid(),
  propriedadeId: z.uuid(),
  nome: z.string().trim().min(1).max(120),
  raca: textoOpcional,
  partida: textoOpcional,
})

export const esquemaAnimal = z.object({
  id: z.uuid(),
  loteId: z.uuid(),
  numero: z.string().trim().min(1).max(40),
  nascimento: dataOpcional,
  peso: z.number().positive().max(2000).nullish().transform(v => v ?? null),
  raca: textoOpcional,
  previsaoParto: dataOpcional,
  touroPrenhez: textoOpcional,
  numPrenhezes: contagem,
  numAbortos: contagem,
  numPerdasGestacionais: contagem,
  numPartos: contagem,
  diasVazia: contagem,
  motivoDescarte: z.enum(['saude_uterina', 'cisto', 'defeito_congenito']).nullish().transform(v => v ?? null),
})

export const esquemaAtendimento = z.object({
  id: z.uuid(),
  loteId: z.uuid(),
  tipo: z.enum(['dg_iatf', 'so_dg']),
  status: z.enum(['dg', 'protocolo', 'finalizado']),
  dataD0: data,
  gnrh: z.boolean().nullish().transform(v => v ?? null),
  horaD8: hora,
  horaD10: hora,
  inseminador: textoOpcional,
  animaisPerdidos: z.number().int().min(0).max(10000).default(0),
})

export const esquemaAtendimentoAnimal = z.object({
  id: z.uuid(),
  atendimentoId: z.uuid(),
  animalId: z.uuid(),
  situacaoDg: z.enum(['pendente', 'prenha', 'vazia', 'descarte', 'refugo']),
  idadeGestacional: textoOpcional,
  destinoDescarte: textoOpcional,
  motivoRefugo: textoOpcional,
  hormonioDia: z.enum(['d7', 'd8', 'd9']).nullish().transform(v => v ?? null),
  inseminada: z.boolean().nullish().transform(v => v ?? null),
  justificativaNaoInseminada: textoOpcional,
  semenId: z.uuid().nullish().transform(v => v ?? null),
  obs: textoOpcional,
  resultadoD45: z.enum(['prenha', 'vazia']).nullish().transform(v => v ?? null),
})

export const esquemas = {
  propriedade: esquemaPropriedade,
  lote: esquemaLote,
  semen: esquemaSemen,
  animal: esquemaAnimal,
  atendimento: esquemaAtendimento,
  atendimentoAnimal: esquemaAtendimentoAnimal,
}

export type Entidade = keyof typeof esquemas

export const esquemaOperacao = z.object({
  id: z.string().min(1).max(64),
  entidade: z.enum(['propriedade', 'lote', 'semen', 'animal', 'atendimento', 'atendimentoAnimal']),
  dados: z.record(z.string(), z.unknown()),
})

export const esquemaPerfil = z.object({
  nome: z.string().trim().min(1).max(120),
  crmv: textoOpcional,
  empresa: textoOpcional,
  local: textoOpcional,
  logoUrl: z.url().nullish().or(z.literal('')).transform(v => v || null),
  contato: textoOpcional,
})

export const esquemaCadastro = z.object({
  nome: z.string().trim().min(1).max(120),
  email: z.email().trim().toLowerCase(),
  senha: z.string().min(8).max(200),
})

export const esquemaLogin = z.object({
  email: z.email().trim().toLowerCase(),
  senha: z.string().min(1).max(200),
})

export const esquemaEsqueci = z.object({
  email: z.email().trim().toLowerCase(),
})

export const esquemaRedefinir = z.object({
  token: z.string().min(20).max(200),
  senha: z.string().min(8).max(200),
})
