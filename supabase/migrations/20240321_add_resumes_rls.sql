-- Enable RLS
alter table resumes enable row level security;
alter table job_preferences enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can insert their own resumes" on resumes;
drop policy if exists "Users can view their own resumes" on resumes;
drop policy if exists "Users can update their own resumes" on resumes;
drop policy if exists "Users can delete their own resumes" on resumes;
drop policy if exists "Users can upload their own resumes" on storage.objects;
drop policy if exists "Users can view their own resumes" on storage.objects;
drop policy if exists "Users can update their own resumes" on storage.objects;
drop policy if exists "Users can delete their own resumes" on storage.objects;
drop policy if exists "Users can manage their own preferences" on job_preferences;

-- Create policies for resumes
create policy "Users can insert their own resumes"
on resumes for insert
with check (auth.uid() = user_id);

create policy "Users can view their own resumes"
on resumes for select
using (auth.uid() = user_id);

create policy "Users can update their own resumes"
on resumes for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own resumes"
on resumes for delete
using (auth.uid() = user_id);

-- Create policies for job_preferences
create policy "Users can manage their own preferences"
on job_preferences for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

-- Storage policies
create policy "Users can upload their own resumes"
on storage.objects for insert
with check (
  bucket_id = 'resumes' and
  auth.uid() = (storage.foldername(name))[1]
);

create policy "Users can view their own resumes"
on storage.objects for select
using (
  bucket_id = 'resumes' and
  auth.uid() = (storage.foldername(name))[1]
);

create policy "Users can update their own resumes"
on storage.objects for update
using (
  bucket_id = 'resumes' and
  auth.uid() = (storage.foldername(name))[1]
);

create policy "Users can delete their own resumes"
on storage.objects for delete
using (
  bucket_id = 'resumes' and
  auth.uid() = (storage.foldername(name))[1]
);
