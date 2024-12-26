-- Update only the LinkedIn account jobs
-- Replace LINKEDIN_CLERK_USER_ID with the Clerk user ID from your LinkedIn login
UPDATE jobs 
SET user_id = 'LINKEDIN_CLERK_USER_ID'
WHERE user_id = 'jonasbager@gmail.com'
RETURNING id, user_id, company, position;

-- Verify the update
SELECT id, user_id, company, position 
FROM jobs 
WHERE user_id = 'LINKEDIN_CLERK_USER_ID';
