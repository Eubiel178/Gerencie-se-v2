CREATE TABLE "achievement_unlock" (
	"user_id" text NOT NULL,
	"achievement_id" text NOT NULL,
	"unlocked_at" timestamp NOT NULL,
	CONSTRAINT "achievement_unlock_user_id_achievement_id_pk" PRIMARY KEY("user_id","achievement_id")
);
--> statement-breakpoint
ALTER TABLE "achievement_unlock" ADD CONSTRAINT "achievement_unlock_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;