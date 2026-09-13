CREATE TABLE "password_reset_token" (
	"token" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"expires_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "password_reset_token" ADD CONSTRAINT "password_reset_token_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;