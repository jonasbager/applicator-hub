-- Create a temporary table to store email to user_id mappings
CREATE TEMP TABLE user_mappings (
    email TEXT PRIMARY KEY,
    old_user_id UUID,
    new_user_id TEXT
);

-- Insert existing user mappings from auth.users
INSERT INTO user_mappings (email, old_user_id)
SELECT email, id
FROM auth.users;

-- Update jobs table to use email-based user IDs temporarily
UPDATE public.jobs
SET user_id = (
    SELECT email 
    FROM auth.users 
    WHERE auth.users.id::text = jobs.user_id
);

-- Create function to update jobs with new user IDs
CREATE OR REPLACE FUNCTION update_job_user_ids(p_email TEXT, p_new_user_id TEXT)
RETURNS void AS $$
BEGIN
    UPDATE public.jobs
    SET user_id = p_new_user_id
    WHERE user_id = p_email;
END;
$$ LANGUAGE plpgsql;
