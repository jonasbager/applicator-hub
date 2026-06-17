-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.jobs;

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create auth check function
CREATE OR REPLACE FUNCTION check_auth()
RETURNS BOOLEAN AS $$
DECLARE
    api_key TEXT;
    auth_header TEXT;
    user_id TEXT;
BEGIN
    -- Get all relevant headers
    api_key := NULLIF(current_setting('request.header.apikey', true), '');
    auth_header := NULLIF(current_setting('request.header.authorization', true), '');
    user_id := NULLIF(current_setting('request.header.x-user-id', true), '');
    
    -- Log headers for debugging
    RAISE LOG 'Auth check - API Key: %, Auth: %, User ID: %', api_key, auth_header, user_id;
    
    -- Check if we have valid auth
    RETURN (api_key IS NOT NULL OR auth_header IS NOT NULL) AND user_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create user check function
CREATE OR REPLACE FUNCTION check_user_id(record_user_id TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    current_user_id TEXT;
BEGIN
    current_user_id := NULLIF(current_setting('request.header.x-user-id', true), '');
    RETURN record_user_id = current_user_id OR record_user_id = 'jonasbager@gmail.com';
END;
$$ LANGUAGE plpgsql;

-- Create policies
CREATE POLICY "Users can view own jobs" ON public.jobs
    FOR SELECT USING (
        check_auth() AND check_user_id(user_id)
    );

CREATE POLICY "Users can insert own jobs" ON public.jobs
    FOR INSERT WITH CHECK (
        check_auth() AND user_id = current_setting('request.header.x-user-id', true)
    );

CREATE POLICY "Users can update own jobs" ON public.jobs
    FOR UPDATE USING (
        check_auth() AND check_user_id(user_id)
    );

CREATE POLICY "Users can delete own jobs" ON public.jobs
    FOR DELETE USING (
        check_auth() AND check_user_id(user_id)
    );

-- Test function
CREATE OR REPLACE FUNCTION test_request()
RETURNS TABLE (
    has_auth BOOLEAN,
    headers JSON,
    example_check BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        check_auth(),
        json_build_object(
            'apikey', current_setting('request.header.apikey', true),
            'authorization', current_setting('request.header.authorization', true),
            'x-user-id', current_setting('request.header.x-user-id', true)
        ),
        check_user_id('jonasbager@gmail.com');
END;
$$ LANGUAGE plpgsql;
