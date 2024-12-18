-- Add start_date column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS start_date text;

-- Add comment to describe the column
COMMENT ON COLUMN jobs.start_date IS 'Job start date, can be a date, "ASAP", or null for unknown';

-- Convert existing deadline column to text to support "ASAP"
ALTER TABLE jobs ALTER COLUMN deadline TYPE text;
