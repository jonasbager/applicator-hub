-- Create a function to verify Clerk JWTs
create or replace function auth.clerk_user()
returns jsonb
language sql stable
as $$
  select 
    coalesce(
      nullif(current_setting('request.jwt.claims', true), '')::jsonb,
      '{}'::jsonb
    ) as claims
$$;

-- Create a function to get the current user ID from Clerk JWT
create or replace function auth.uid()
returns text
language sql stable
as $$
  select nullif(auth.clerk_user()->>'sub', '')::text;
$$;

-- Create a function to get the current JWT
create or replace function auth.jwt()
returns jsonb
language sql stable
as $$
  select auth.clerk_user();
$$;
