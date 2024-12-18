-- Add deadline column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS deadline date;

-- Add comment to describe the column
COMMENT ON COLUMN jobs.deadline IS 'Application deadline date for the job posting';
