ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS is_followup BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_tasks_is_followup ON tasks (is_followup);
