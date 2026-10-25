CREATE TABLE "redefinicao_senha" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"veterinario_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expira_em" timestamp with time zone NOT NULL,
	"usado_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "redefinicao_senha_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
ALTER TABLE "redefinicao_senha" ADD CONSTRAINT "redefinicao_senha_veterinario_id_veterinario_id_fk" FOREIGN KEY ("veterinario_id") REFERENCES "public"."veterinario"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
-- No Supabase a API pública não deve ler esta tabela; o app acessa o Postgres direto
ALTER TABLE "redefinicao_senha" ENABLE ROW LEVEL SECURITY;
