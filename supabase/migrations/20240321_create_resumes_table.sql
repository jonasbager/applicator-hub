-- Create resumes table
create table if not exists resumes (
  id uuid default gen_random_uuid() primary key,
  user_id text not null references auth.users(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create resumes bucket
insert into storage.buckets (id, name)
values ('resumes', 'resumes')
on conflict do nothing;
