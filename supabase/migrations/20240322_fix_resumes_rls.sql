-- First, disable RLS to clean up
alter table resumes disable row level security;
alter table job_preferences disable row level security;

-- Drop all existing policies
do $$ 
begin
  -- Drop policies for job_preferences
  execute (
    select string_agg(
      format('drop policy if exists %I on job_preferences', policyname),
      '; '
    )
    from pg_policies 
    where tablename = 'job_preferences'
  );
  
  -- Drop policies for resumes
  execute (
    select string_agg(
      format('drop policy if exists %I on resumes', policyname),
      '; '
    )
    from pg_policies 
    where tablename = 'resumes'
  );
  
  -- Drop policies for storage.objects
  execute (
    select string_agg(
      format('drop policy if exists %I on storage.objects', policyname),
      '; '
    )
    from pg_policies 
    where tablename = 'objects' and schemaname = 'storage'
  );
end $$;

-- Drop all auth-related functions
drop function if exists auth.clerk_user() cascade;
drop function if exists auth.uid() cascade;
drop function if exists auth.jwt() cascade;
drop function if exists get_auth_user_id() cascade;
drop function if exists current_user_id() cascade;

-- Create new auth function with debug logging
create or replace function get_auth_user_id()
returns text
language plpgsql
security definer
as $$
declare
    header_value text;
begin
    -- Get raw headers for debugging
    raise notice 'All headers: %', current_setting('request.headers', true);
    
    -- Get specific header
    header_value := current_setting('request.header.x-user-id', true);
    raise notice 'x-user-id header value: %', header_value;
    
    if header_value is null or header_value = '' then
        raise notice 'No user ID found in header';
        return null;
    end if;
    
    raise notice 'Using user ID from header: %', header_value;
    return header_value;
exception when others then
    raise notice 'Error getting user ID from header: %', sqlerrm;
    return null;
end;
$$;

-- Re-enable RLS
alter table resumes enable row level security;
alter table job_preferences enable row level security;

-- Create permissive policies for testing
create policy "Enable all access to job_preferences"
on job_preferences for all
using (true)
with check (true);

create policy "Enable all access to resumes"
on resumes for all
using (true)
with check (true);

create policy "Enable all access to resume storage"
on storage.objects for all
using (bucket_id = 'resumes')
with check (bucket_id = 'resumes');

-- After verifying access, we can replace with restrictive policies
/*
-- Create policies for job_preferences
create policy "Users can create their own preferences"
on job_preferences for insert
with check (
    get_auth_user_id() is not null and
    get_auth_user_id() = user_id
);

create policy "Users can view their own preferences"
on job_preferences for select
using (
    get_auth_user_id() is not null and
    get_auth_user_id() = user_id
);

create policy "Users can update their own preferences"
on job_preferences for update
using (
    get_auth_user_id() is not null and
    get_auth_user_id() = user_id
)
with check (
    get_auth_user_id() is not null and
    get_auth_user_id() = user_id
);

create policy "Users can delete their own preferences"
on job_preferences for delete
using (
    get_auth_user_id() is not null and
    get_auth_user_id() = user_id
);
*/
