-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.jobs;

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create debug function
CREATE OR REPLACE FUNCTION debug_headers()
RETURNS TEXT AS $$
DECLARE
    headers TEXT;
BEGIN
    SELECT string_agg(name || '=' || setting, E'\n')
    INTO headers
    FROM pg_settings
    WHERE name LIKE 'request.header.%';
    
    RAISE LOG 'Request headers: %', headers;
    RETURN headers;
END;
$$ LANGUAGE plpgsql;

-- Create auth check function
CREATE OR REPLACE FUNCTION is_valid_request()
RETURNS BOOLEAN AS $$
DECLARE
    has_auth BOOLEAN;
BEGIN
    -- Log all headers for debugging
    PERFORM debug_headers();
    
    -- Check for any auth header
    has_auth := COALESCE(
        current_setting('request.header.apikey', true),
        current_setting('request.header.authorization', true)
    ) IS NOT NULL;
    
    RAISE LOG 'Auth check result: %', has_auth;
    RETURN has_auth;
END;
$$ LANGUAGE plpgsql;

-- Create simple policies that only check for auth
CREATE POLICY "Users can view own jobs" ON public.jobs
    FOR SELECT USING (is_valid_request());

CREATE POLICY "Users can insert own jobs" ON public.jobs
    FOR INSERT WITH CHECK (is_valid_request());

CREATE POLICY "Users can update own jobs" ON public.jobs
    FOR UPDATE USING (is_valid_request());

CREATE POLICY "Users can delete own jobs" ON public.jobs
    FOR DELETE USING (is_valid_request());

-- Test function
CREATE OR REPLACE FUNCTION test_auth()
RETURNS TABLE (
    headers TEXT,
    has_auth BOOLEAN,
    example_query BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        debug_headers(),
        is_valid_request(),
        EXISTS (SELECT 1 FROM jobs LIMIT 1);
END;
$$ LANGUAGE plpgsql;
