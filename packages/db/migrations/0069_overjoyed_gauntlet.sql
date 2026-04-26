ALTER TABLE "genui_users" DROP CONSTRAINT "genui_users_project_id_projects_id_fk";
--> statement-breakpoint
ALTER TABLE "genui_users" DROP COLUMN "project_id";