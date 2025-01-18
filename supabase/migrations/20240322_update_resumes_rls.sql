-- Drop existing policies
drop policy if exists "Users can view their own resumes" on public.resumes;
drop policy if exists "Users can insert their own resumes" on public.resumes;
drop policy if exists "Users can update their own resumes" on public.resumes;
drop policy if exists "Users can delete their own resumes" on public.resumes;
drop policy if exists "Users can view their own resumes" on storage.objects;
drop policy if exists "Users can upload their own resumes" on storage.objects;
drop policy if exists "Users can update their own resumes" on storage.objects;
drop policy if exists "Users can delete their own resumes" on storage.objects;

-- Create new policies using get_auth_user_id()
create policy "Users can view their own resumes"
  on public.resumes for select
  using (get_auth_user_id() = user_id);

create policy "Users can insert their own resumes"
  on public.resumes for insert
  with check (get_auth_user_id() = user_id);

create policy "Users can update their own resumes"
  on public.resumes for update
  using (get_auth_user_id() = user_id)
  with check (get_auth_user_id() = user_id);

create policy "Users can delete their own resumes"
  on public.resumes for delete
  using (get_auth_user_id() = user_id);

-- Add storage policies
create policy "Users can view their own resumes"
  on storage.objects for select
  using (bucket_id = 'resumes' and get_auth_user_id() = (storage.foldername(name))[1]);

create policy "Users can upload their own resumes"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes' 
    and get_auth_user_id() = (storage.foldername(name))[1]
    and (storage.extension(name) = 'pdf' or storage.extension(name) = 'doc' or storage.extension(name) = 'docx')
  );

create policy "Users can update their own resumes"
  on storage.objects for update
  using (bucket_id = 'resumes' and get_auth_user_id() = (storage.foldername(name))[1]);

create policy "Users can delete their own resumes"
  on storage.objects for delete
  using (bucket_id = 'resumes' and get_auth_user_id() = (storage.foldername(name))[1]);
