-- Disable the trigger temporarily
ALTER TABLE auth.users DISABLE TRIGGER USER;

-- First, check if the test user already exists and delete if necessary
DO $$
BEGIN
    -- Delete existing user and profile if they exist
    DELETE FROM auth.users WHERE email = 'test@example.com';
    DELETE FROM public.profiles WHERE email = 'test@example.com';
END $$;

-- Create a test user with a known password
-- Password is: test123!@#
WITH new_user AS (
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'test@example.com',
    crypt('test123!@#', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Test User"}',
    NOW(),
    NOW(),
    '',
    '',
    '',
    ''
  ) RETURNING id
)
-- Create a profile for the test user
INSERT INTO public.profiles (
  id,
  email,
  full_name,
  created_at,
  updated_at
)
SELECT 
  id,
  'test@example.com',
  'Test User',
  NOW(),
  NOW()
FROM new_user;

-- Re-enable the trigger
ALTER TABLE auth.users ENABLE TRIGGER USER;
