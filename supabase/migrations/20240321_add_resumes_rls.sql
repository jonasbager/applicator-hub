-- Enable RLS
alter table resumes enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can insert their own resumes" on resumes;
drop policy if exists "Users can view their own resumes" on resumes;
drop policy if exists "Users can update their own resumes" on resumes;
drop policy if exists "Users can delete their own resumes" on resumes;
drop policy if exists "Users can upload their own resumes" on storage.objects;
drop policy if exists "Users can view their own resumes" on storage.objects;
drop policy if exists "Users can update their own resumes" on storage.objects;
drop policy if exists "Users can delete their own resumes" on storage.objects;

-- Drop and recreate function to get current user ID from header
drop function if exists current_user_id();
create function current_user_id()
returns uuid
language sql
stable
as $$
  select cast(nullif(current_setting('request.header.x-user-id', true), '') as uuid);
$$;

-- Create policies
create policy "Users can insert their own resumes"
on resumes for insert
with check (current_user_id() = user_id);

create policy "Users can view their own resumes"
on resumes for select
using (current_user_id() = user_id);

create policy "Users can update their own resumes"
on resumes for update
using (current_user_id() = user_id)
with check (current_user_id() = user_id);

create policy "Users can delete their own resumes"
on resumes for delete
using (current_user_id() = user_id);

-- Storage policies
create policy "Users can upload their own resumes"
on storage.objects for insert
with check (
  bucket_id = 'resumes' and
  cast(current_user_id() as text) = (storage.foldername(name))[1]
);

create policy "Users can view their own resumes"
on storage.objects for select
using (
  bucket_id = 'resumes' and
  cast(current_user_id() as text) = (storage.foldername(name))[1]
);

create policy "Users can update their own resumes"
on storage.objects for update
using (
  bucket_id = 'resumes' and
  cast(current_user_id() as text) = (storage.foldername(name))[1]
);

create policy "Users can delete their own resumes"
on storage.objects for delete
using (
  bucket_id = 'resumes' and
  cast(current_user_id() as text) = (storage.foldername(name))[1]
);
