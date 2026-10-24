CREATE TABLE "animal" (
	"id" uuid PRIMARY KEY NOT NULL,
	"lote_id" uuid NOT NULL,
	"numero" text NOT NULL,
	"nascimento" date,
	"peso" numeric,
	"raca" text,
	"previsao_parto" date,
	"touro_prenhez" text,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento" (
	"id" uuid PRIMARY KEY NOT NULL,
	"lote_id" uuid NOT NULL,
	"tipo" text NOT NULL,
	"status" text DEFAULT 'dg' NOT NULL,
	"data_d0" date NOT NULL,
	"data_d8" date NOT NULL,
	"data_d10" date NOT NULL,
	"data_d45" date NOT NULL,
	"gnrh" boolean,
	"hora_d8" time,
	"hora_d10" time,
	"inseminador" text,
	"animais_perdidos" integer DEFAULT 0 NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "atendimento_animal" (
	"id" uuid PRIMARY KEY NOT NULL,
	"atendimento_id" uuid NOT NULL,
	"animal_id" uuid NOT NULL,
	"situacao_dg" text DEFAULT 'pendente' NOT NULL,
	"idade_gestacional" text,
	"destino_descarte" text,
	"motivo_refugo" text,
	"em_protocolo" boolean DEFAULT false NOT NULL,
	"hormonio_dia" text,
	"inseminada" boolean,
	"justificativa_nao_inseminada" text,
	"obs" text,
	"resultado_d45" text,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "atendimento_animal_atendimento_id_animal_id_unique" UNIQUE("atendimento_id","animal_id")
);
--> statement-breakpoint
CREATE TABLE "lote" (
	"id" uuid PRIMARY KEY NOT NULL,
	"propriedade_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"local_principal" text,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "propriedade" (
	"id" uuid PRIMARY KEY NOT NULL,
	"veterinario_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"proprietario" text,
	"local" text,
	"inscricao" text,
	"semen_tipo" text,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "veterinario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"senha_hash" text NOT NULL,
	"nome" text NOT NULL,
	"crmv" text,
	"empresa" text,
	"local" text,
	"logo_url" text,
	"contato" text,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "veterinario_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "animal" ADD CONSTRAINT "animal_lote_id_lote_id_fk" FOREIGN KEY ("lote_id") REFERENCES "public"."lote"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento" ADD CONSTRAINT "atendimento_lote_id_lote_id_fk" FOREIGN KEY ("lote_id") REFERENCES "public"."lote"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_animal" ADD CONSTRAINT "atendimento_animal_atendimento_id_atendimento_id_fk" FOREIGN KEY ("atendimento_id") REFERENCES "public"."atendimento"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_animal" ADD CONSTRAINT "atendimento_animal_animal_id_animal_id_fk" FOREIGN KEY ("animal_id") REFERENCES "public"."animal"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lote" ADD CONSTRAINT "lote_propriedade_id_propriedade_id_fk" FOREIGN KEY ("propriedade_id") REFERENCES "public"."propriedade"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "propriedade" ADD CONSTRAINT "propriedade_veterinario_id_veterinario_id_fk" FOREIGN KEY ("veterinario_id") REFERENCES "public"."veterinario"("id") ON DELETE cascade ON UPDATE no action;