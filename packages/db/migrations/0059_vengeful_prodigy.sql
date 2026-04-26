CREATE TABLE "genui_users" (
	"id" text PRIMARY KEY DEFAULT generate_custom_id('tu_') NOT NULL,
	"user_id" uuid NOT NULL,
	"project_id" text,
	"last_activity_at" timestamp with time zone DEFAULT now() NOT NULL,
	"has_setup_project" boolean DEFAULT false NOT NULL,
	"welcome_email_sent" boolean DEFAULT false NOT NULL,
	"welcome_email_error" text,
	"welcome_email_sent_at" timestamp with time zone,
	"reactivation_email_sent_at" timestamp with time zone,
	"reactivation_email_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "genui_users_id_unique" UNIQUE("id"),
	CONSTRAINT "genui_users_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
DROP TABLE "user_lifecycle_tracking" CASCADE;--> statement-breakpoint
DROP TABLE "welcome_email_tracking" CASCADE;--> statement-breakpoint
ALTER TABLE "genui_users" ADD CONSTRAINT "genui_users_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "genui_users" ADD CONSTRAINT "genui_users_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_genui_users_user_id" ON "genui_users" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_genui_users_last_activity" ON "genui_users" USING btree ("last_activity_at");--> statement-breakpoint
CREATE INDEX "idx_genui_users_reactivation_sent" ON "genui_users" USING btree ("reactivation_email_sent_at");--> statement-breakpoint
CREATE INDEX "idx_genui_users_welcome_email_sent" ON "genui_users" USING btree ("welcome_email_sent");