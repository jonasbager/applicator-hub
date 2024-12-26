-- First, let's check and enable the required settings
DO $$ 
BEGIN 
    -- Enable request.headers setting
    ALTER DATABASE postgres SET "request.headers" TO 'x-user-id';
    
    -- Also enable it for the current session
    SET request.headers TO 'x-user-id';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'Could not set request.headers: %', SQLERRM;
END $$;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.jobs;

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create simple policies
CREATE POLICY "Users can view own jobs" ON public.jobs
    FOR SELECT USING (
        user_id = COALESCE(current_setting('request.header.x-user-id', true), '')
    );

CREATE POLICY "Users can insert own jobs" ON public.jobs
    FOR INSERT WITH CHECK (
        user_id = COALESCE(current_setting('request.header.x-user-id', true), '')
    );

CREATE POLICY "Users can update own jobs" ON public.jobs
    FOR UPDATE USING (
        user_id = COALESCE(current_setting('request.header.x-user-id', true), '')
    );

CREATE POLICY "Users can delete own jobs" ON public.jobs
    FOR DELETE USING (
        user_id = COALESCE(current_setting('request.header.x-user-id', true), '')
    );

-- Create a test function
CREATE OR REPLACE FUNCTION test_header()
RETURNS TABLE (
    header_value TEXT,
    example_query BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(current_setting('request.header.x-user-id', true), 'no header'),
        EXISTS (
            SELECT 1 FROM jobs 
            WHERE user_id = COALESCE(current_setting('request.header.x-user-id', true), '')
            LIMIT 1
        );
END;
$$ LANGUAGE plpgsql;
