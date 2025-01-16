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
drop function if exists current_user_id() cascade;
create or replace function current_user_id()
returns text
language plpgsql
security definer
as $$
begin
    -- Get the user ID from the request header set by our client
    return nullif(current_setting('request.header.x-user-id', true), '');
exception
    when others then
        return null;
end;
$$;

-- Enable RLS
alter table resumes enable row level security;
alter table job_preferences enable row level security;

-- Create separate policies for job_preferences to handle initial creation
create policy "Users can create their own preferences"
on job_preferences for insert
with check (
    current_user_id() is not null and
    current_user_id() = user_id
);

create policy "Users can view their own preferences"
on job_preferences for select
using (
    current_user_id() is not null and
    current_user_id() = user_id
);

create policy "Users can update their own preferences"
on job_preferences for update
using (
    current_user_id() is not null and
    current_user_id() = user_id
)
with check (
    current_user_id() is not null and
    current_user_id() = user_id
);

create policy "Users can delete their own preferences"
on job_preferences for delete
using (
    current_user_id() is not null and
    current_user_id() = user_id
);

-- Create policies for resumes
create policy "Users can insert their own resumes"
on resumes for insert
with check (
    current_user_id() is not null and
    current_user_id() = user_id
);

create policy "Users can view their own resumes"
on resumes for select
using (
    current_user_id() is not null and
    current_user_id() = user_id
);

create policy "Users can update their own resumes"
on resumes for update
using (
    current_user_id() is not null and
    current_user_id() = user_id
)
with check (
    current_user_id() is not null and
    current_user_id() = user_id
);

create policy "Users can delete their own resumes"
on resumes for delete
using (
    current_user_id() is not null and
    current_user_id() = user_id
);

-- Storage policies
create policy "Users can upload their own resumes"
on storage.objects for insert
with check (
    bucket_id = 'resumes' and
    current_user_id() is not null and
    current_user_id() = (storage.foldername(name))[1]
);

create policy "Users can view their own resumes"
on storage.objects for select
using (
    bucket_id = 'resumes' and
    current_user_id() is not null and
    current_user_id() = (storage.foldername(name))[1]
);

create policy "Users can update their own resumes"
on storage.objects for update
using (
    bucket_id = 'resumes' and
    current_user_id() is not null and
    current_user_id() = (storage.foldername(name))[1]
);

create policy "Users can delete their own resumes"
on storage.objects for delete
using (
    bucket_id = 'resumes' and
    current_user_id() is not null and
    current_user_id() = (storage.foldername(name))[1]
);
