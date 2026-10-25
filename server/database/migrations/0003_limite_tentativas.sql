CREATE TABLE "tentativa_acesso" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chave" text NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "tentativa_acesso_chave_criado_em_idx" ON "tentativa_acesso" USING btree ("chave","criado_em");