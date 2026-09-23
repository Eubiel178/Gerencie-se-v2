-- Drop active_intention table (redundant with execution_session.taskId)
DROP TABLE IF EXISTS "active_intention";

-- Drop mascot_message column (messages are transient, not persisted)
ALTER TABLE "execution_session" DROP COLUMN IF EXISTS "mascot_message";

-- Drop steps column (task.steps is the source of truth)
ALTER TABLE "execution_session" DROP COLUMN IF EXISTS "steps";
