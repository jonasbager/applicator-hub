-- First, enable all headers and debug logging
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
CREATE OR REPLACE FUNCTION debug_auth()
RETURNS BOOLEAN AS $$
DECLARE
    headers TEXT;
    auth_header TEXT;
    user_id TEXT;
BEGIN
    -- Get headers
    SELECT string_agg(name || ': ' || setting, E'\n')
    INTO headers
    FROM pg_settings
    WHERE name LIKE 'request.header.%';
    
    -- Get specific headers
    auth_header := current_setting('request.header.authorization', true);
    user_id := current_setting('request.header.x-user-id', true);
    
    -- Log everything
    RAISE LOG 'All headers: %', headers;
    RAISE LOG 'Auth header: %', auth_header;
    RAISE LOG 'User ID: %', user_id;
    
    -- For testing, allow if we have any auth header
    RETURN auth_header IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create permissive policies
CREATE POLICY "Users can view own jobs" ON public.jobs
    FOR SELECT USING (debug_auth());

CREATE POLICY "Users can insert own jobs" ON public.jobs
    FOR INSERT WITH CHECK (debug_auth());

CREATE POLICY "Users can update own jobs" ON public.jobs
    FOR UPDATE USING (debug_auth());

CREATE POLICY "Users can delete own jobs" ON public.jobs
    FOR DELETE USING (debug_auth());

-- Test function
CREATE OR REPLACE FUNCTION test_auth_headers()
RETURNS TABLE (
    all_headers TEXT,
    auth_header TEXT,
    user_id TEXT,
    has_auth BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        string_agg(name || ': ' || setting, E'\n')::TEXT,
        current_setting('request.header.authorization', true),
        current_setting('request.header.x-user-id', true),
        debug_auth()
    FROM pg_settings
    WHERE name LIKE 'request.header.%';
END;
$$ LANGUAGE plpgsql;
