ALTER TABLE "execution_session" ADD COLUMN "resumed_at" timestamp;--> statement-breakpoint
UPDATE "execution_session" SET "resumed_at" = "started_at" WHERE "resumed_at" IS NULL;--> statement-breakpoint
ALTER TABLE "execution_session" ALTER COLUMN "resumed_at" SET NOT NULL;