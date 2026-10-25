CREATE TABLE "insumo" (
	"id" uuid PRIMARY KEY NOT NULL,
	"veterinario_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"unidade" text NOT NULL,
	"saldo" numeric NOT NULL,
	"saldo_em" date NOT NULL,
	"uso_por_vaca" numeric,
	"minimo" numeric,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "semen" ADD COLUMN "estoque_doses" integer;--> statement-breakpoint
ALTER TABLE "semen" ADD COLUMN "estoque_em" date;--> statement-breakpoint
ALTER TABLE "semen" ADD COLUMN "estoque_minimo" integer;--> statement-breakpoint
ALTER TABLE "insumo" ADD CONSTRAINT "insumo_veterinario_id_veterinario_id_fk" FOREIGN KEY ("veterinario_id") REFERENCES "public"."veterinario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- No Supabase a API pública não deve ler esta tabela; o app acessa o Postgres direto
ALTER TABLE "insumo" ENABLE ROW LEVEL SECURITY;
