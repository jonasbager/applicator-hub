-- Add company_url column to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_url TEXT;

-- Update existing jobs to extract company URLs from job URLs
UPDATE jobs
SET company_url = CASE
  WHEN url LIKE '%linkedin.com%' THEN NULL  -- Skip LinkedIn URLs
  WHEN url LIKE '%indeed.com%' THEN NULL    -- Skip Indeed URLs
  ELSE url  -- Use job URL as company URL for direct company postings
END;
