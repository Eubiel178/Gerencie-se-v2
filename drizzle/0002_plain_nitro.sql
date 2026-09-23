/* 
    Unfortunately in current drizzle-kit version we can't automatically get name for primary key.
    We are working on making it available!

    Meanwhile you can:
        1. Check pk name in your database, by running
            SELECT constraint_name FROM information_schema.table_constraints
            WHERE table_schema = 'public'
                AND table_name = 'habit_log'
                AND constraint_type = 'PRIMARY KEY';
        2. Uncomment code below and paste pk name manually
        
    Hope to release this update as soon as possible
*/

-- ALTER TABLE "habit_log" DROP CONSTRAINT "<constraint_name>";--> statement-breakpoint
ALTER TABLE "mascot_state" ALTER COLUMN "name" SET DEFAULT 'Chunchumaru';--> statement-breakpoint
ALTER TABLE "mascot_state" ADD COLUMN "personality" text DEFAULT 'afetuoso' NOT NULL;