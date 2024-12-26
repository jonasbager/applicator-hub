-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.jobs;

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create debug function
CREATE OR REPLACE FUNCTION get_request_info()
RETURNS TEXT AS $$
DECLARE
    auth_header TEXT;
    user_id TEXT;
BEGIN
    -- Try to get headers safely
    BEGIN
        auth_header := current_setting('request.header.authorization', true);
        user_id := current_setting('request.header.x-user-id', true);
        
        RETURN format(
            'Auth: %s, User ID: %s',
            COALESCE(auth_header, 'none'),
            COALESCE(user_id, 'none')
        );
    EXCEPTION WHEN OTHERS THEN
        RETURN 'Error getting headers: ' || SQLERRM;
    END;
END;
$$ LANGUAGE plpgsql;

-- Create simple policies that allow all authenticated requests
CREATE POLICY "Users can view own jobs" ON public.jobs
    FOR SELECT USING (
        current_setting('request.header.authorization', true) IS NOT NULL
    );

CREATE POLICY "Users can insert own jobs" ON public.jobs
    FOR INSERT WITH CHECK (
        current_setting('request.header.authorization', true) IS NOT NULL
    );

CREATE POLICY "Users can update own jobs" ON public.jobs
    FOR UPDATE USING (
        current_setting('request.header.authorization', true) IS NOT NULL
    );

CREATE POLICY "Users can delete own jobs" ON public.jobs
    FOR DELETE USING (
        current_setting('request.header.authorization', true) IS NOT NULL
    );

-- Test function
CREATE OR REPLACE FUNCTION test_auth()
RETURNS TABLE (
    request_info TEXT,
    has_auth BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        get_request_info(),
        current_setting('request.header.authorization', true) IS NOT NULL;
END;
$$ LANGUAGE plpgsql;
