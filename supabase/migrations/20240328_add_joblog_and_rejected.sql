-- Add in_joblog column
ALTER TABLE jobs ADD COLUMN in_joblog BOOLEAN DEFAULT FALSE;

-- Add company_url column
ALTER TABLE jobs ADD COLUMN company_url TEXT;

-- Create job_status enum if it doesn't exist
DO $$ BEGIN
    CREATE TYPE job_status AS ENUM ('Not Started', 'In Progress', 'Submitted', 'Interview', 'Rejected');
EXCEPTION
    WHEN duplicate_object THEN
        -- If the type already exists, add the new value
        ALTER TYPE job_status ADD VALUE IF NOT EXISTS 'Rejected';
END $$;

-- Update jobs table to use job_status if not already using it
DO $$ BEGIN
    ALTER TABLE jobs ALTER COLUMN status TYPE job_status USING status::job_status;
EXCEPTION
    WHEN others THEN NULL;
END $$;
