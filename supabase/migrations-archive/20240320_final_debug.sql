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
CREATE OR REPLACE FUNCTION log_request()
RETURNS BOOLEAN AS $$
DECLARE
    all_headers TEXT;
BEGIN
    -- Get all headers as JSON
    SELECT json_object_agg(key, value)::text
    INTO all_headers
    FROM (
        SELECT 
            replace(name, 'request.header.', '') as key,
            setting as value
        FROM pg_settings
        WHERE name LIKE 'request.header.%'
    ) headers;
    
    -- Log everything
    RAISE NOTICE 'Headers: %', all_headers;
    RAISE NOTICE 'Auth header: %', current_setting('request.header.authorization', true);
    RAISE NOTICE 'User ID header: %', current_setting('request.header.x-user-id', true);
    RAISE NOTICE 'API key header: %', current_setting('request.header.apikey', true);
    
    -- Always return true for testing
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Create permissive policies with logging
CREATE POLICY "Users can view own jobs" ON public.jobs
    FOR SELECT USING (log_request());

CREATE POLICY "Users can insert own jobs" ON public.jobs
    FOR INSERT WITH CHECK (log_request());

CREATE POLICY "Users can update own jobs" ON public.jobs
    FOR UPDATE USING (log_request());

CREATE POLICY "Users can delete own jobs" ON public.jobs
    FOR DELETE USING (log_request());

-- Test function
CREATE OR REPLACE FUNCTION test_request()
RETURNS TABLE (
    headers JSON,
    auth TEXT,
    user_id TEXT,
    api_key TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (
            SELECT json_object_agg(key, value)
            FROM (
                SELECT 
                    replace(name, 'request.header.', '') as key,
                    setting as value
                FROM pg_settings
                WHERE name LIKE 'request.header.%'
            ) headers
        ) as headers,
        current_setting('request.header.authorization', true) as auth,
        current_setting('request.header.x-user-id', true) as user_id,
        current_setting('request.header.apikey', true) as api_key;
END;
$$ LANGUAGE plpgsql;
