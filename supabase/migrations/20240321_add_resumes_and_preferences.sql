-- Create resume storage bucket
insert into storage.buckets (id, name, public) values ('resumes', 'resumes', false);

-- Create policy to allow users to upload their own resumes
create policy "Users can upload their own resumes"
  on storage.objects for insert
  with check (
    bucket_id = 'resumes' AND
    auth.uid() = owner
  );

-- Create policy to allow users to read their own resumes
create policy "Users can read their own resumes"
  on storage.objects for select
  using (
    bucket_id = 'resumes' AND
    auth.uid() = owner
  );

-- Create resumes table
create table public.resumes (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null references auth.users(id) on delete cascade,
  file_path text not null,
  file_name text not null,
  content text, -- Extracted text content
  parsed_data jsonb, -- Structured data extracted by AI
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create job preferences table
create table public.job_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null references auth.users(id) on delete cascade,
  level text[], -- e.g., ['Junior', 'Mid']
  roles text[], -- e.g., ['Product Manager', 'UX Designer']
  locations text[], -- e.g., ['Copenhagen', 'Remote']
  skills text[], -- e.g., ['React', 'TypeScript']
  min_salary integer,
  max_salary integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id)
);

-- Create saved jobs table
create table public.saved_jobs (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null references auth.users(id) on delete cascade,
  job_id uuid not null references public.jobs(id) on delete cascade,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id, job_id)
);

-- Add RLS policies
alter table public.resumes enable row level security;
alter table public.job_preferences enable row level security;
alter table public.saved_jobs enable row level security;

-- Resumes policies
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

-- Job preferences policies
create policy "Users can view their own preferences"
  on public.job_preferences for select
  using (auth.uid() = user_id);

create policy "Users can insert their own preferences"
  on public.job_preferences for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own preferences"
  on public.job_preferences for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete their own preferences"
  on public.job_preferences for delete
  using (auth.uid() = user_id);

-- Saved jobs policies
create policy "Users can view their saved jobs"
  on public.saved_jobs for select
  using (auth.uid() = user_id);

create policy "Users can save jobs"
  on public.saved_jobs for insert
  with check (auth.uid() = user_id);

create policy "Users can unsave jobs"
  on public.saved_jobs for delete
  using (auth.uid() = user_id);

-- Add indexes
create index resumes_user_id_idx on public.resumes(user_id);
create index job_preferences_user_id_idx on public.job_preferences(user_id);
create index saved_jobs_user_id_idx on public.saved_jobs(user_id);
create index saved_jobs_job_id_idx on public.saved_jobs(job_id);
