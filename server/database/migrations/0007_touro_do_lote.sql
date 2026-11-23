ALTER TABLE "atendimento" ADD COLUMN "semen_id" uuid;--> statement-breakpoint
ALTER TABLE "atendimento" ADD COLUMN "varios_touros" boolean;--> statement-breakpoint
ALTER TABLE "atendimento" ADD CONSTRAINT "atendimento_semen_id_semen_id_fk" FOREIGN KEY ("semen_id") REFERENCES "public"."semen"("id") ON DELETE set null ON UPDATE no action;