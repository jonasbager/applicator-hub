-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.jobs;

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create function to check auth
CREATE OR REPLACE FUNCTION is_authenticated()
RETURNS BOOLEAN AS $$
BEGIN
    -- Check for either apikey or Authorization header
    RETURN COALESCE(
        current_setting('request.header.apikey', true),
        current_setting('request.header.authorization', true)
    ) IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- Create function to get user ID
CREATE OR REPLACE FUNCTION get_user_id()
RETURNS TEXT AS $$
BEGIN
    RETURN NULLIF(current_setting('request.header.x-user-id', true), '');
END;
$$ LANGUAGE plpgsql;

-- Create policies that check for either auth header
CREATE POLICY "Users can view own jobs" ON public.jobs
    FOR SELECT USING (
        is_authenticated()
        AND (
            user_id = get_user_id()
            OR user_id = 'jonasbager@gmail.com'  -- Allow access to old jobs
        )
    );

CREATE POLICY "Users can insert own jobs" ON public.jobs
    FOR INSERT WITH CHECK (
        is_authenticated()
        AND user_id = get_user_id()
    );

CREATE POLICY "Users can update own jobs" ON public.jobs
    FOR UPDATE USING (
        is_authenticated()
        AND user_id = get_user_id()
    );

CREATE POLICY "Users can delete own jobs" ON public.jobs
    FOR DELETE USING (
        is_authenticated()
        AND user_id = get_user_id()
    );

-- Test function
CREATE OR REPLACE FUNCTION test_auth_status()
RETURNS TABLE (
    is_auth BOOLEAN,
    user_id TEXT,
    api_key TEXT,
    auth_header TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        is_authenticated(),
        get_user_id(),
        current_setting('request.header.apikey', true),
        current_setting('request.header.authorization', true);
END;
$$ LANGUAGE plpgsql;
