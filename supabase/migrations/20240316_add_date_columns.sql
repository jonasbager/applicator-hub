-- Convert existing deadline column to text and add start_date column
ALTER TABLE jobs ALTER COLUMN deadline TYPE text;
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS start_date text;

-- Add comments to describe the columns
COMMENT ON COLUMN jobs.deadline IS 'Application deadline date, can be a date, "ASAP", or null for unknown';
COMMENT ON COLUMN jobs.start_date IS 'Job start date, can be a date, "ASAP", or null for unknown';
