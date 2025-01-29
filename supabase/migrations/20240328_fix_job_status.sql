-- Drop and recreate job_status enum to ensure correct order
DROP TYPE IF EXISTS job_status CASCADE;
CREATE TYPE job_status AS ENUM ('Not Started', 'In Progress', 'Submitted', 'Interview', 'Rejected');

-- Temporarily make status nullable to handle the transition
ALTER TABLE jobs ALTER COLUMN status DROP NOT NULL;

-- Update existing jobs to use valid status values
UPDATE jobs SET status = CASE status::text
    WHEN 'Not Started' THEN 'Not Started'::job_status
    WHEN 'In Progress' THEN 'In Progress'::job_status
    WHEN 'Submitted' THEN 'Submitted'::job_status
    WHEN 'Interview' THEN 'Interview'::job_status
    WHEN 'Rejected' THEN 'Rejected'::job_status
    ELSE 'Not Started'::job_status
END;

-- Make status non-nullable again and set the type constraint
ALTER TABLE jobs 
    ALTER COLUMN status TYPE job_status USING status::job_status,
    ALTER COLUMN status SET NOT NULL;

-- Add check constraint to ensure valid status values
ALTER TABLE jobs DROP CONSTRAINT IF EXISTS jobs_status_check;
ALTER TABLE jobs ADD CONSTRAINT jobs_status_check 
    CHECK (status IN ('Not Started', 'In Progress', 'Submitted', 'Interview', 'Rejected'));
