-- Enable RLS
alter table resumes enable row level security;

-- Create policies
create policy "Users can insert their own resumes"
on resumes for insert
with check (auth.uid()::text = user_id);

create policy "Users can view their own resumes"
on resumes for select
using (auth.uid()::text = user_id);

create policy "Users can update their own resumes"
on resumes for update
using (auth.uid()::text = user_id)
with check (auth.uid()::text = user_id);

create policy "Users can delete their own resumes"
on resumes for delete
using (auth.uid()::text = user_id);

-- Storage policies
create policy "Users can upload their own resumes"
on storage.objects for insert
with check (
  bucket_id = 'resumes' and
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can view their own resumes"
on storage.objects for select
using (
  bucket_id = 'resumes' and
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can update their own resumes"
on storage.objects for update
using (
  bucket_id = 'resumes' and
  auth.uid()::text = (storage.foldername(name))[1]
);

create policy "Users can delete their own resumes"
on storage.objects for delete
using (
  bucket_id = 'resumes' and
  auth.uid()::text = (storage.foldername(name))[1]
);
