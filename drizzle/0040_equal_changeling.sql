ALTER TABLE "user_preference" ADD COLUMN "assistant_companion_daily_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preference" ADD COLUMN "assistant_companion_daily_date" text;--> statement-breakpoint
ALTER TABLE "user_preference" ADD COLUMN "assistant_companion_last_text" text;