ALTER TABLE "user_preference" ADD COLUMN "assistant_companion_last_spoke_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user_preference" ADD COLUMN "assistant_companion_abuse_guard_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "user_preference" ADD COLUMN "assistant_companion_abuse_guard_date" text;