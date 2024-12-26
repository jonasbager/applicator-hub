-- Check current jobs
SELECT id, user_id, company, position FROM jobs;

-- Check auth users
SELECT id, email FROM auth.users;

-- Check if the initial update worked
UPDATE public.jobs
SET user_id = (
    SELECT email 
    FROM auth.users 
    WHERE auth.users.id::text = jobs.user_id
)
RETURNING id, user_id, company, position;

-- Create a more verbose update function
CREATE OR REPLACE FUNCTION update_job_user_ids(p_email TEXT, p_new_user_id TEXT)
RETURNS TABLE (
    job_id UUID,
    old_user_id TEXT,
    new_user_id TEXT,
    company TEXT,
    position TEXT
) AS $$
BEGIN
    RETURN QUERY
    UPDATE public.jobs
    SET user_id = p_new_user_id
    WHERE user_id = p_email
    RETURNING id, user_id AS old_user_id, p_new_user_id AS new_user_id, company, position;
END;
$$ LANGUAGE plpgsql;
