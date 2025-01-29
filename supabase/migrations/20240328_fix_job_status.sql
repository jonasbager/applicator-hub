-- Drop existing check constraint
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;

-- Add new check constraint with Rejected status
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
    CHECK (status IN ('Not Started', 'In Progress', 'Submitted', 'Interview', 'Rejected'));
