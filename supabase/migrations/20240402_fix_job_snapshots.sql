-- Drop and recreate the job_snapshots table to fix schema cache
DROP TABLE IF EXISTS job_snapshots CASCADE;

-- Create job_snapshots table
CREATE TABLE job_snapshots (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  job_id UUID NOT NULL REFERENCES jobs(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  position TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  keywords TEXT[] NOT NULL,
  url TEXT NOT NULL,
  html_content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE job_snapshots ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY select_own_snapshots ON job_snapshots
  FOR SELECT
  USING (user_id = current_user_id());

CREATE POLICY insert_own_snapshots ON job_snapshots
  FOR INSERT
  WITH CHECK (user_id = current_user_id());

CREATE POLICY delete_own_snapshots ON job_snapshots
  FOR DELETE
  USING (user_id = current_user_id());

-- Create indexes
CREATE INDEX job_snapshots_job_id_idx ON job_snapshots(job_id);
CREATE INDEX job_snapshots_user_id_idx ON job_snapshots(user_id);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';
