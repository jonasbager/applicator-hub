-- First, enable headers and logging
ALTER DATABASE postgres SET "request.headers" TO '*';
ALTER DATABASE postgres SET log_min_messages TO 'DEBUG1';

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.jobs;

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create debug function
CREATE OR REPLACE FUNCTION debug_request()
RETURNS TABLE (
    setting_name TEXT,
    setting_value TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT name::TEXT, setting::TEXT 
    FROM pg_settings 
    WHERE name LIKE 'request.%'
    ORDER BY name;
END;
$$ LANGUAGE plpgsql;

-- Create test policy function
CREATE OR REPLACE FUNCTION check_auth()
RETURNS BOOLEAN AS $$
DECLARE
    headers TEXT;
    user_id TEXT;
    auth TEXT;
BEGIN
    -- Log all request settings
    RAISE NOTICE 'Request settings: %', (SELECT json_agg(row_to_json(t)) FROM debug_request() t);
    
    -- Get and log specific headers
    user_id := current_setting('request.header.x-user-id', true);
    auth := current_setting('request.header.authorization', true);
    RAISE NOTICE 'x-user-id: %, authorization: %', user_id, auth;
    
    RETURN true;  -- Allow all operations for testing
END;
$$ LANGUAGE plpgsql;

-- Create simple policies that log everything
CREATE POLICY "Users can view own jobs" ON public.jobs
    FOR SELECT USING (check_auth());

CREATE POLICY "Users can insert own jobs" ON public.jobs
    FOR INSERT WITH CHECK (check_auth());

CREATE POLICY "Users can update own jobs" ON public.jobs
    FOR UPDATE USING (check_auth());

CREATE POLICY "Users can delete own jobs" ON public.jobs
    FOR DELETE USING (check_auth());
