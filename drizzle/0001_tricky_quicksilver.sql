CREATE TABLE "connection" (
	"id" text PRIMARY KEY NOT NULL,
	"requester_id" text NOT NULL,
	"addressee_id" text,
	"addressee_email" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"created_at" timestamp NOT NULL,
	"responded_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "goal" ADD COLUMN "shared_with_user_id" text;--> statement-breakpoint
ALTER TABLE "habit" ADD COLUMN "shared_with_user_id" text;--> statement-breakpoint
ALTER TABLE "routine_item" ADD COLUMN "shared_with_user_id" text;--> statement-breakpoint
ALTER TABLE "task" ADD COLUMN "shared_with_user_id" text;--> statement-breakpoint
ALTER TABLE "connection" ADD CONSTRAINT "connection_requester_id_user_id_fk" FOREIGN KEY ("requester_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "connection" ADD CONSTRAINT "connection_addressee_id_user_id_fk" FOREIGN KEY ("addressee_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "goal" ADD CONSTRAINT "goal_shared_with_user_id_user_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "habit" ADD CONSTRAINT "habit_shared_with_user_id_user_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_item" ADD CONSTRAINT "routine_item_shared_with_user_id_user_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task" ADD CONSTRAINT "task_shared_with_user_id_user_id_fk" FOREIGN KEY ("shared_with_user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;