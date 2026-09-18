ALTER TABLE "task" ADD COLUMN "work_status" text DEFAULT 'pending' NOT NULL;--> statement-breakpoint
UPDATE "task" SET "work_status" = 'in_progress' WHERE "started_at" IS NOT NULL;
