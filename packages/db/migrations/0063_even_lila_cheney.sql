--> statement-breakpoint
ALTER TABLE "genui_users" ADD COLUMN "legal_accepted" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "genui_users" ADD COLUMN "legal_accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "genui_users" ADD COLUMN "legal_version" text;--> statement-breakpoint
CREATE INDEX "idx_genui_users_legal_accepted" ON "genui_users" USING btree ("legal_accepted");--> statement-breakpoint