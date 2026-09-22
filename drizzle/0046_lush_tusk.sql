ALTER TABLE "execution_session" ALTER COLUMN "started_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "execution_session" ALTER COLUMN "resumed_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "execution_session" ALTER COLUMN "paused_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "execution_session" ALTER COLUMN "completed_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "execution_session" ALTER COLUMN "updated_at" SET DATA TYPE timestamp with time zone;--> statement-breakpoint
ALTER TABLE "execution_session" ALTER COLUMN "last_checkin_sent_at" SET DATA TYPE timestamp with time zone;