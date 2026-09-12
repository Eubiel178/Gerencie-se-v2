ALTER TABLE "user_preference" ADD COLUMN "assistant_daily_insight_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preference" ADD COLUMN "assistant_daily_insight_date" text;--> statement-breakpoint
ALTER TABLE "user_preference" ADD COLUMN "assistant_last_insight_text" text;