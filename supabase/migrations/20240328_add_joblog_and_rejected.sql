-- Add in_joblog column
ALTER TABLE jobs ADD COLUMN in_joblog BOOLEAN DEFAULT FALSE;

-- Add company_url column
ALTER TABLE jobs ADD COLUMN company_url TEXT;

-- Update status enum to include 'Rejected'
ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'Rejected';
