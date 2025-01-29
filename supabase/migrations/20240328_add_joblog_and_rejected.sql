-- Add in_joblog column
ALTER TABLE jobs ADD COLUMN in_joblog BOOLEAN DEFAULT FALSE;

-- Add company_url column
ALTER TABLE jobs ADD COLUMN company_url TEXT;

-- Drop and recreate job_status enum to ensure correct order
DROP TYPE IF EXISTS job_status CASCADE;
CREATE TYPE job_status AS ENUM ('Not Started', 'In Progress', 'Submitted', 'Interview', 'Rejected');

-- Update jobs table to use new job_status enum
ALTER TABLE jobs ALTER COLUMN status TYPE job_status USING status::text::job_status;
