-- Drop JWT-related functions
drop function if exists auth.clerk_user() cascade;
drop function if exists auth.uid() cascade;
drop function if exists auth.jwt() cascade;

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
end;
$$;

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
drop policy if exists "Users can create their own preferences" on job_preferences;
drop policy if exists "Users can view their own preferences" on job_preferences;
drop policy if exists "Users can update their own preferences" on job_preferences;
drop policy if exists "Users can delete their own preferences" on job_preferences;

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
)
with check (
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
