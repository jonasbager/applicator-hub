-- First, update existing jobs to use the Clerk user ID
UPDATE jobs 
SET user_id = 'user_2qjsKRlaaYJCqYGiS5sFYiG5un6'
WHERE user_id = 'jonasbager@gmail.com';

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.jobs;

-- Enable RLS
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- Create policies using exact Clerk user ID format
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

-- Test function
CREATE OR REPLACE FUNCTION test_clerk_auth()
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
            WHERE user_id = 'user_2qjsKRlaaYJCqYGiS5sFYiG5un6'
            LIMIT 1
        );
END;
$$ LANGUAGE plpgsql;
