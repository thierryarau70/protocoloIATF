CREATE TABLE "semen" (
	"id" uuid PRIMARY KEY NOT NULL,
	"propriedade_id" uuid NOT NULL,
	"nome" text NOT NULL,
	"raca" text,
	"partida" text,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "atendimento_animal" ADD COLUMN "semen_id" uuid;--> statement-breakpoint
ALTER TABLE "semen" ADD CONSTRAINT "semen_propriedade_id_propriedade_id_fk" FOREIGN KEY ("propriedade_id") REFERENCES "public"."propriedade"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atendimento_animal" ADD CONSTRAINT "atendimento_animal_semen_id_semen_id_fk" FOREIGN KEY ("semen_id") REFERENCES "public"."semen"("id") ON DELETE set null ON UPDATE no action;