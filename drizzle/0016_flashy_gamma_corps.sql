CREATE TABLE "routine_item_log" (
	"id" text NOT NULL,
	"routine_item_id" text NOT NULL,
	"user_id" text NOT NULL,
	"date" text NOT NULL,
	"completed_at" timestamp NOT NULL,
	CONSTRAINT "routine_item_log_routine_item_id_date_pk" PRIMARY KEY("routine_item_id","date")
);
--> statement-breakpoint
ALTER TABLE "routine_item_log" ADD CONSTRAINT "routine_item_log_routine_item_id_routine_item_id_fk" FOREIGN KEY ("routine_item_id") REFERENCES "public"."routine_item"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "routine_item_log" ADD CONSTRAINT "routine_item_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;