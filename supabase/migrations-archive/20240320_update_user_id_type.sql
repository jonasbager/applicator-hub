-- First, drop existing foreign key constraint and RLS policies
ALTER TABLE public.jobs DROP CONSTRAINT jobs_user_id_fkey;
DROP POLICY IF EXISTS "Users can view own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can insert own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can update own jobs" ON public.jobs;
DROP POLICY IF EXISTS "Users can delete own jobs" ON public.jobs;

-- Change user_id column type to TEXT
ALTER TABLE public.jobs ALTER COLUMN user_id TYPE TEXT;

-- Create new RLS policies using direct string comparison
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

-- Create function to get current user ID from JWT claims
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS TEXT AS $$
BEGIN
    RETURN nullif(current_setting('request.jwt.claims', true)::json->>'sub', '')::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
