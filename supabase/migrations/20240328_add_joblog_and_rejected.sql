-- Add in_joblog column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE jobs ADD COLUMN in_joblog BOOLEAN DEFAULT FALSE;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Add company_url column if it doesn't exist
DO $$ BEGIN
    ALTER TABLE jobs ADD COLUMN company_url TEXT;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;
