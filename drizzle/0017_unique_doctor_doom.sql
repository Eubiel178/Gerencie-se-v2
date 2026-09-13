CREATE TABLE "login_attempt" (
	"user_id" text PRIMARY KEY NOT NULL,
	"failed_count" integer DEFAULT 0 NOT NULL,
	"window_started_at" timestamp,
	"last_alert_sent_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "login_attempt" ADD CONSTRAINT "login_attempt_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;