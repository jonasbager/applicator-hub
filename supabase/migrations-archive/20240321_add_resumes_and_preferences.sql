-- Create resumes table
create table if not exists resumes (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  file_path text not null,
  file_name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create job_preferences table
create table if not exists job_preferences (
  id uuid default gen_random_uuid() primary key,
  user_id text not null,
  level text[] default array[]::text[],
  roles text[] default array[]::text[],
  locations text[] default array[]::text[],
  skills text[] default array[]::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id)
);

-- Create resumes bucket
insert into storage.buckets (id, name)
values ('resumes', 'resumes')
on conflict do nothing;
