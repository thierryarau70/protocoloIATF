import { z } from 'zod'

/*
 * Regras de cada registro, usadas no aparelho (antes de salvar, para mostrar o erro no campo) e
 * no servidor (que recusa o que não passar). Cada regra tem a sua mensagem, em português.
 */

// Mensagem de reserva para o que não tem mensagem própria; validarCampos põe o nome do campo na frente
const GENERICAS: Record<string, string> = {
  invalid_type: 'valor inválido',
  too_small: 'valor abaixo do permitido',
  too_big: 'valor acima do permitido',
  invalid_format: 'formato inválido',
  invalid_value: 'opção inválida',
}
z.config({ customError: iss => GENERICAS[iss.code] ?? 'valor inválido' })

/** Data de hoje no Brasil (AAAA-MM-DD): o servidor roda em UTC e virava o dia às 21h */
export function hojeNoBrasil(): string {
  return new Intl.DateTimeFormat('sv-SE', { timeZone: 'America/Sao_Paulo' }).format(new Date())
}
export function somarDiasData(data: string, dias: number) {
  const d = new Date(`${data}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + dias)
  return d.toISOString().slice(0, 10)
}

const texto = (rotulo: string, max = 200) => z.string().trim().max(max, `${rotulo}: use no máximo ${max} caracteres.`)
const textoOpcional = texto('Texto').nullish().transform(v => v || null)
const nome = (oQue: string) => texto('Nome', 120).min(1, `Informe o nome ${oQue}.`)
const data = (rotulo: string) => z.string({ error: `${rotulo}: informe a data.` })
  .regex(/^\d{4}-\d{2}-\d{2}$/, `${rotulo}: data inválida.`)
  .refine(v => !Number.isNaN(Date.parse(`${v}T00:00:00Z`)), `${rotulo}: data inválida.`)
const dataOpcional = (rotulo: string) => data(rotulo).nullish().transform(v => v || null)
const inteiro = (rotulo: string, max = 10000) => z.number({ error: `${rotulo}: informe um número.` })
  .int(`${rotulo}: use um número inteiro.`).min(0, `${rotulo}: não pode ser negativo.`).max(max, `${rotulo}: no máximo ${max.toLocaleString('pt-BR')}.`)
const contagem = (rotulo: string) => inteiro(rotulo).nullish().transform(v => v ?? null)
const hora = (rotulo: string) => z.string().regex(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, `${rotulo}: hora inválida.`).nullish().transform(v => v || null)

export const esquemaPropriedade = z.object({
  id: z.uuid(),
  nome: nome('da propriedade'),
  proprietario: texto('Proprietário').nullish().transform(v => v || null),
  local: texto('Local').nullish().transform(v => v || null),
  inscricao: texto('Inscrição').nullish().transform(v => v || null),
  semenTipo: z.enum(['particular', 'misto']).nullish().transform(v => v ?? null),
})

export const esquemaLote = z.object({
  id: z.uuid(),
  propriedadeId: z.uuid('Escolha a propriedade do lote.'),
  nome: nome('do lote'),
  localPrincipal: texto('Local principal').nullish().transform(v => v || null),
})

export const esquemaSemen = z.object({
  id: z.uuid(),
  propriedadeId: z.uuid(),
  nome: nome('do sêmen (touro)'),
  raca: texto('Raça').nullish().transform(v => v || null),
  partida: texto('Partida').nullish().transform(v => v || null),
  estoqueDoses: inteiro('Doses em estoque', 100000).nullish().transform(v => v ?? null),
  estoqueEm: dataOpcional('Data da contagem'),
  estoqueMinimo: inteiro('Estoque mínimo', 100000).nullish().transform(v => v ?? null),
})

const quantidade = (rotulo: string) => z.number({ error: `${rotulo}: informe um número.` })
  .min(0, `${rotulo}: não pode ser negativo.`).max(1000000, `${rotulo}: valor alto demais.`)

export const esquemaInsumo = z.object({
  id: z.uuid(),
  nome: nome('do item'),
  unidade: texto('Unidade', 30).min(1, 'Informe a unidade (mL, unidades…).'),
  saldo: quantidade('Quantidade em estoque'),
  saldoEm: data('Data da contagem'),
  usoPorVaca: quantidade('Uso por vaca').nullish().transform(v => v ?? null),
  minimo: quantidade('Estoque mínimo').nullish().transform(v => v ?? null),
})

/** Gestação bovina dura cerca de 283 dias: uma previsão de parto além disso está errada */
const MAX_DIAS_ATE_PARTO = 300
const MAX_IDADE_ANOS = 30

export const esquemaAnimal = z.object({
  id: z.uuid(),
  loteId: z.uuid('Escolha o lote da vaca.'),
  numero: texto('Número', 40).min(1, 'Informe o número da vaca.'),
  nascimento: dataOpcional('Nascimento')
    .refine(v => !v || v < hojeNoBrasil(), 'A data de nascimento precisa ser anterior a hoje.')
    .refine(v => !v || v >= somarDiasData(hojeNoBrasil(), -365 * MAX_IDADE_ANOS), `A data de nascimento é de mais de ${MAX_IDADE_ANOS} anos atrás: confira o ano.`),
  peso: z.number({ error: 'Peso: informe um número.' })
    .positive('O peso precisa ser maior que zero.').max(2000, 'O peso passa de 2.000 kg: confira o valor.')
    .nullish().transform(v => v ?? null),
  raca: texto('Raça').nullish().transform(v => v || null),
  previsaoParto: dataOpcional('Previsão de parto')
    .refine(v => !v || v <= somarDiasData(hojeNoBrasil(), MAX_DIAS_ATE_PARTO), 'A previsão de parto está a mais de 10 meses daqui: confira a data.'),
  touroPrenhez: texto('Touro da prenhez').nullish().transform(v => v || null),
  numPrenhezes: contagem('Prenhezes'),
  numAbortos: contagem('Abortos'),
  numPerdasGestacionais: contagem('Perdas gestacionais'),
  numPartos: contagem('Partos'),
  diasVazia: contagem('Dias vazia'),
  motivoDescarte: z.enum(['saude_uterina', 'cisto', 'defeito_congenito']).nullish().transform(v => v ?? null),
}).superRefine((a, ctx) => {
  if (a.nascimento && a.previsaoParto && a.previsaoParto <= a.nascimento) {
    ctx.addIssue({ code: 'custom', path: ['previsaoParto'], message: 'A previsão de parto precisa ser depois do nascimento.' })
  }
  if (a.numPrenhezes !== null && a.numPartos !== null && a.numPartos > a.numPrenhezes) {
    ctx.addIssue({ code: 'custom', path: ['numPartos'], message: 'Partos não pode ser maior que o número de prenhezes.' })
  }
  const perdidas = (a.numAbortos ?? 0) + (a.numPerdasGestacionais ?? 0)
  if (a.numPrenhezes !== null && perdidas > a.numPrenhezes) {
    ctx.addIssue({ code: 'custom', path: ['numAbortos'], message: 'Abortos e perdas gestacionais somam mais que as prenhezes.' })
  }
})

export const esquemaAtendimento = z.object({
  id: z.uuid(),
  loteId: z.uuid(),
  tipo: z.enum(['dg_iatf', 'so_dg']),
  status: z.enum(['dg', 'protocolo', 'finalizado']),
  dataD0: data('Data do D0'),
  gnrh: z.boolean().nullish().transform(v => v ?? null),
  horaD8: hora('Hora do D8'),
  horaD10: hora('Hora do D10'),
  inseminador: texto('Inseminador').nullish().transform(v => v || null),
  animaisPerdidos: inteiro('Animais perdidos').default(0),
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
  insumo: esquemaInsumo,
}

export type Entidade = keyof typeof esquemas

const ROTULOS: Record<string, string> = {
  nome: 'Nome', numero: 'Número', peso: 'Peso', raca: 'Raça', unidade: 'Unidade', saldo: 'Quantidade',
  situacaoDg: 'Situação no DG', hormonioDia: 'Dia do hormônio', semenId: 'Sêmen', resultadoD45: 'Resultado do D45',
  tipo: 'Tipo de atendimento', status: 'Etapa', motivoDescarte: 'Motivo do descarte', semenTipo: 'Tipo de sêmen',
}
const genericas = new Set(Object.values(GENERICAS).concat('valor inválido'))

/** Problemas de validação como { campo: mensagem }, uma mensagem por campo (a primeira) */
export function errosDoZod(erro: z.ZodError): Record<string, string> {
  const erros: Record<string, string> = {}
  for (const problema of erro.issues) {
    const campo = String(problema.path[0] ?? '')
    if (erros[campo]) continue
    erros[campo] = genericas.has(problema.message)
      ? `${ROTULOS[campo] ?? 'Campo'}: ${problema.message}.`
      : problema.message
  }
  return erros
}

/** Valida um registro antes de salvar no aparelho; vazio quando está tudo certo */
export function validarCampos(entidade: Entidade, dados: unknown): Record<string, string> {
  const r = esquemas[entidade].safeParse(dados)
  return r.success ? {} : errosDoZod(r.error)
}

/** Como o registro aparece para a pessoa nos avisos: "Vaca 202", "Lote Novilhas"… */
export function descreverRegistro(entidade: Entidade, dados: Record<string, unknown>): string {
  const n = (v: unknown) => (typeof v === 'string' && v.trim() ? ` ${v.trim()}` : '')
  switch (entidade) {
    case 'animal': return `Vaca${n(dados.numero)}`
    case 'lote': return `Lote${n(dados.nome)}`
    case 'propriedade': return `Propriedade${n(dados.nome)}`
    case 'semen': return `Sêmen${n(dados.nome)}`
    case 'insumo': return `Item de estoque${n(dados.nome)}`
    case 'atendimento': return 'Atendimento'
    case 'atendimentoAnimal': return 'Linha do DG/planilha'
  }
}

export const esquemaOperacao = z.object({
  id: z.string().min(1).max(64),
  entidade: z.enum(['propriedade', 'lote', 'semen', 'animal', 'atendimento', 'atendimentoAnimal', 'insumo']),
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
