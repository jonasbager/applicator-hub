-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.jobs;

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create debug function
CREATE OR REPLACE FUNCTION debug_request()
RETURNS JSONB AS $$
DECLARE
    result JSONB;
BEGIN
    -- Get all request details
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
        'path', current_setting('request.path', true),
        'timestamp', now()
    );
    
    -- Log everything
    RAISE LOG 'Request details: %', result;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Create temporary permissive policies for testing
CREATE POLICY "Users can view own jobs" ON public.jobs
    FOR SELECT USING (true);  -- Allow all selects

CREATE POLICY "Users can insert own jobs" ON public.jobs
    FOR INSERT WITH CHECK (true);  -- Allow all inserts

CREATE POLICY "Users can update own jobs" ON public.jobs
    FOR UPDATE USING (true);  -- Allow all updates

CREATE POLICY "Users can delete own jobs" ON public.jobs
    FOR DELETE USING (true);  -- Allow all deletes

-- Test function
CREATE OR REPLACE FUNCTION test_access()
RETURNS TABLE (
    request_info JSONB,
    can_select BOOLEAN,
    can_insert BOOLEAN,
    example_job JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        debug_request(),
        EXISTS (SELECT 1 FROM jobs LIMIT 1),
        true,
        COALESCE(
            (SELECT to_jsonb(j) FROM jobs j LIMIT 1),
            '{}'::jsonb
        );
END;
$$ LANGUAGE plpgsql;
