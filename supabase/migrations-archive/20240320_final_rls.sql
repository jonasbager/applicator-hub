-- Enable header in Postgres config
DO $$ 
BEGIN 
  -- Try to enable headers at database level
  ALTER DATABASE postgres SET "request.headers" TO 'x-user-id';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not set request.headers at database level: %', SQLERRM;
END $$;

-- Create function to get user ID from header
CREATE OR REPLACE FUNCTION get_auth_user_id()
RETURNS TEXT AS $$
DECLARE
    header_value TEXT;
BEGIN
    -- Get the user ID from the request header
    BEGIN
        header_value := current_setting('request.header.x-user-id', true);
        
        IF header_value IS NULL OR header_value = '' THEN
            RETURN NULL;
        END IF;
        
        RETURN header_value;
    EXCEPTION WHEN OTHERS THEN
        RETURN NULL;
    END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.jobs;

-- Enable RLS on jobs table
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create policies with debug logging
CREATE POLICY "Users can view own jobs" ON public.jobs
    FOR SELECT USING (
        CASE 
            WHEN get_auth_user_id() IS NULL THEN false
            WHEN user_id = get_auth_user_id() THEN true
            ELSE false
        END
    );

CREATE POLICY "Users can insert own jobs" ON public.jobs
    FOR INSERT WITH CHECK (
        CASE 
            WHEN get_auth_user_id() IS NULL THEN false
            WHEN user_id = get_auth_user_id() THEN true
            ELSE false
        END
    );

CREATE POLICY "Users can update own jobs" ON public.jobs
    FOR UPDATE USING (
        CASE 
            WHEN get_auth_user_id() IS NULL THEN false
            WHEN user_id = get_auth_user_id() THEN true
            ELSE false
        END
    );

CREATE POLICY "Users can delete own jobs" ON public.jobs
    FOR DELETE USING (
        CASE 
            WHEN get_auth_user_id() IS NULL THEN false
            WHEN user_id = get_auth_user_id() THEN true
            ELSE false
        END
    );

-- Test function (you can run this to verify header handling)
CREATE OR REPLACE FUNCTION test_auth_header(test_user_id TEXT)
RETURNS TABLE (
    header_value TEXT,
    matches_test BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        get_auth_user_id() as header_value,
        get_auth_user_id() = test_user_id as matches_test;
END;
$$ LANGUAGE plpgsql;
