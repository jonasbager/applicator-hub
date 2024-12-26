-- First create the function to get current user ID from request header
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS TEXT AS $$
BEGIN
    -- Get the user ID from the request header set by our client
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::json->>'sub',
        current_setting('request.header.x-user-id', true)
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Then drop existing RLS policies
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.jobs;

-- Create new RLS policies that work with the user_id directly
CREATE POLICY "Users can view own jobs"
    ON public.jobs FOR SELECT
    USING (user_id = current_user_id());

CREATE POLICY "Users can insert own jobs"
    ON public.jobs FOR INSERT
    WITH CHECK (user_id = current_user_id());

CREATE POLICY "Users can update own jobs"
    ON public.jobs FOR UPDATE
    USING (user_id = current_user_id());

CREATE POLICY "Users can delete own jobs"
    ON public.jobs FOR DELETE
    USING (user_id = current_user_id());
