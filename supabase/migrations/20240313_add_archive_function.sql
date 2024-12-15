-- First add the archived column if it doesn't exist
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT FALSE;

-- Then create the archive function with fixed user_id reference
CREATE OR REPLACE FUNCTION archive_job(job_id UUID, user_id_param UUID)
RETURNS jobs AS $$
BEGIN
  UPDATE jobs
  SET archived = TRUE
  WHERE id = job_id AND user_id = user_id_param
  RETURNING *;
END;
$$ LANGUAGE plpgsql;
