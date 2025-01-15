-- Create recommended_jobs table
create table public.recommended_jobs (
  id uuid primary key default uuid_generate_v4(),
  position text not null,
  company text not null,
  description text not null,
  url text not null,
  level text not null,
  type text not null,
  location text not null,
  salary jsonb,
  keywords text[] not null default '{}',
  applicants_count integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create job_preferences table
create table public.job_preferences (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null references auth.users(id) on delete cascade,
  level text[] not null default '{}',
  roles text[] not null default '{}',
  locations text[] not null default '{}',
  skills text[] not null default '{}',
  min_salary integer,
  max_salary integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (user_id)
);

-- Add RLS policies
alter table public.recommended_jobs enable row level security;
alter table public.job_preferences enable row level security;

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

-- Recommended jobs policies
create policy "Anyone can view recommended jobs"
  on public.recommended_jobs for select
  using (true);

-- Add indexes
create index job_preferences_user_id_idx on public.job_preferences(user_id);
create index recommended_jobs_level_idx on public.recommended_jobs(level);
create index recommended_jobs_location_idx on public.recommended_jobs(location);
create index recommended_jobs_created_at_idx on public.recommended_jobs(created_at desc);

-- Add function to update updated_at timestamp
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Add triggers
create trigger set_updated_at
  before update on public.recommended_jobs
  for each row
  execute function public.handle_updated_at();

create trigger set_updated_at
  before update on public.job_preferences
  for each row
  execute function public.handle_updated_at();
