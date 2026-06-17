-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.jobs;

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create debug function
CREATE OR REPLACE FUNCTION log_request_details()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Collect all request details
    result := jsonb_build_object(
        'headers', (
            SELECT jsonb_object_agg(
                replace(name, 'request.header.', ''),
                setting
            )
            FROM pg_settings
            WHERE name LIKE 'request.header.%'
        ),
        'method', current_setting('request.method', true),
        'path', current_setting('request.path', true)
    );
    
    -- Log details
    RAISE LOG 'Request details: %', result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create auth check function
CREATE OR REPLACE FUNCTION has_valid_auth()
RETURNS BOOLEAN AS $$
DECLARE
    details JSONB;
    result BOOLEAN;
BEGIN
    -- Get and log request details
    details := log_request_details();
    
    -- Check for either apikey or Authorization header
    result := (
        details->'headers'->>'apikey' IS NOT NULL OR
        details->'headers'->>'authorization' IS NOT NULL
    );
    
    -- Log result
    RAISE LOG 'Auth check result: %, details: %', result, details;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create simple policies that allow all authenticated requests
CREATE POLICY "Users can view own jobs" ON public.jobs
    FOR SELECT USING (has_valid_auth());

CREATE POLICY "Users can insert own jobs" ON public.jobs
    FOR INSERT WITH CHECK (has_valid_auth());

CREATE POLICY "Users can update own jobs" ON public.jobs
    FOR UPDATE USING (has_valid_auth());

CREATE POLICY "Users can delete own jobs" ON public.jobs
    FOR DELETE USING (has_valid_auth());

-- Test function
CREATE OR REPLACE FUNCTION test_request()
RETURNS TABLE (
    request_details JSONB,
    is_authenticated BOOLEAN,
    can_query BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        log_request_details(),
        has_valid_auth(),
        EXISTS (SELECT 1 FROM jobs LIMIT 1);
END;
$$ LANGUAGE plpgsql;
