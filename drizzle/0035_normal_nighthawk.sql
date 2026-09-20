CREATE TABLE "active_intention" (
	"user_id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL,
	"task_title" text NOT NULL,
	"execution_session_id" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "execution_session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"task_id" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_step_index" integer DEFAULT 0 NOT NULL,
	"steps" text DEFAULT '[]' NOT NULL,
	"mascot_message" text,
	"started_at" timestamp NOT NULL,
	"paused_at" timestamp,
	"completed_at" timestamp,
	"updated_at" timestamp NOT NULL,
	"last_checkin_sent_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "active_intention" ADD CONSTRAINT "active_intention_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_intention" ADD CONSTRAINT "active_intention_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "active_intention" ADD CONSTRAINT "active_intention_execution_session_id_execution_session_id_fk" FOREIGN KEY ("execution_session_id") REFERENCES "public"."execution_session"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_session" ADD CONSTRAINT "execution_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "execution_session" ADD CONSTRAINT "execution_session_task_id_task_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."task"("id") ON DELETE cascade ON UPDATE no action;