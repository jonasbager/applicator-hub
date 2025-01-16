-- Enable header in Postgres config (if not already enabled)
DO $$ 
BEGIN 
  ALTER DATABASE postgres SET "request.headers" TO 'x-user-id';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Could not set request.headers at database level: %', SQLERRM;
END $$;

-- Drop existing policies
drop policy if exists "Users can insert their own resumes" on resumes;
drop policy if exists "Users can view their own resumes" on resumes;
drop policy if exists "Users can update their own resumes" on resumes;
drop policy if exists "Users can delete their own resumes" on resumes;
drop policy if exists "Users can upload their own resumes" on storage.objects;
drop policy if exists "Users can view their own resumes" on storage.objects;
drop policy if exists "Users can update their own resumes" on storage.objects;
drop policy if exists "Users can delete their own resumes" on storage.objects;
drop policy if exists "Users can manage their own preferences" on job_preferences;

-- Drop and recreate function to get current user ID from header
drop function if exists get_auth_user_id() cascade;
create or replace function get_auth_user_id()
returns text
language plpgsql
security definer
as $$
declare
    header_value text;
begin
    -- Get the user ID from the request header
    begin
        header_value := current_setting('request.header.x-user-id', true);
        
        if header_value is null or header_value = '' then
            return null;
        end if;
        
        return header_value;
    exception when others then
        return null;
    end;
end;
$$;

-- Enable RLS
alter table resumes enable row level security;
alter table job_preferences enable row level security;

-- Create separate policies for job_preferences to handle initial creation
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

-- Create policies for resumes
create policy "Users can insert their own resumes"
on resumes for insert
with check (
    get_auth_user_id() is not null and
    get_auth_user_id() = user_id
);

create policy "Users can view their own resumes"
on resumes for select
using (
    get_auth_user_id() is not null and
    get_auth_user_id() = user_id
);

create policy "Users can update their own resumes"
on resumes for update
using (
    get_auth_user_id() is not null and
    get_auth_user_id() = user_id
)
with check (
    get_auth_user_id() is not null and
    get_auth_user_id() = user_id
);

create policy "Users can delete their own resumes"
on resumes for delete
using (
    get_auth_user_id() is not null and
    get_auth_user_id() = user_id
);

-- Storage policies
create policy "Users can upload their own resumes"
on storage.objects for insert
with check (
    bucket_id = 'resumes' and
    get_auth_user_id() is not null and
    get_auth_user_id() = (storage.foldername(name))[1]
);

create policy "Users can view their own resumes"
on storage.objects for select
using (
    bucket_id = 'resumes' and
    get_auth_user_id() is not null and
    get_auth_user_id() = (storage.foldername(name))[1]
);

create policy "Users can update their own resumes"
on storage.objects for update
using (
    bucket_id = 'resumes' and
    get_auth_user_id() is not null and
    get_auth_user_id() = (storage.foldername(name))[1]
);

create policy "Users can delete their own resumes"
on storage.objects for delete
using (
    bucket_id = 'resumes' and
    get_auth_user_id() is not null and
    get_auth_user_id() = (storage.foldername(name))[1]
);