-- Create resumes table
create table public.resumes (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null references auth.users(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.resumes enable row level security;

-- Add RLS policies
create policy "Users can view their own resumes"
  on public.resumes for select
  using (auth.uid() = user_id);

create policy "Users can insert their own resumes"
  on public.resumes for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own resumes"
  on public.resumes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own resumes"
  on public.resumes for delete
  using (auth.uid() = user_id);

-- Add indexes
create index resumes_user_id_idx on public.resumes(user_id);
create index resumes_created_at_idx on public.resumes(created_at desc);

-- Add trigger for updated_at
create trigger set_updated_at
  before update on public.resumes
  for each row
  execute function public.handle_updated_at();

-- Create storage bucket for resumes
insert into storage.buckets (id, name, public)
values ('resumes', 'resumes', false);

-- Add storage policies
create policy "Users can view their own resumes"
  on storage.objects for select
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can upload their own resumes"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes' 
    and auth.uid()::text = (storage.foldername(name))[1]
    and (storage.extension(name) = 'pdf' or storage.extension(name) = 'doc' or storage.extension(name) = 'docx')
  );

create policy "Users can update their own resumes"
  on storage.objects for update
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can delete their own resumes"
  on storage.objects for delete
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);
