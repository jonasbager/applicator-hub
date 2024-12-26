-- First, enable headers at database level
ALTER DATABASE postgres SET "request.headers" TO 'x-user-id,apikey,authorization';

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.jobs;

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create basic policies
CREATE POLICY "Users can view own jobs" ON public.jobs
    FOR SELECT USING (true);  -- Allow all selects for testing

CREATE POLICY "Users can insert own jobs" ON public.jobs
    FOR INSERT WITH CHECK (true);  -- Allow all inserts for testing

CREATE POLICY "Users can update own jobs" ON public.jobs
    FOR UPDATE USING (true);  -- Allow all updates for testing

CREATE POLICY "Users can delete own jobs" ON public.jobs
    FOR DELETE USING (true);  -- Allow all deletes for testing

-- Test function
CREATE OR REPLACE FUNCTION test_headers()
RETURNS TABLE (
    user_id TEXT,
    auth TEXT,
    apikey TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        current_setting('request.header.x-user-id', true),
        current_setting('request.header.authorization', true),
        current_setting('request.header.apikey', true);
END;
$$ LANGUAGE plpgsql;
