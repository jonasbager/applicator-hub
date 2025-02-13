-- Add match_percentage column to jobs table
ALTER TABLE jobs ADD COLUMN match_percentage INTEGER;

-- Update existing jobs to have null match_percentage
UPDATE jobs SET match_percentage = NULL;
