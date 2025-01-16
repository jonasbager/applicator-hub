-- Create resumes table if it doesn't exist
create table if not exists public.resumes (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  file_path text not null,
  file_name text not null,
  content text,
  parsed_data jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.resumes enable row level security;

-- Create policies if they don't exist
do $$
begin
  -- View policy
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'resumes' 
    and policyname = 'Users can view their own resumes'
  ) then
    create policy "Users can view their own resumes"
      on public.resumes for select
      using (
        -- Use the x-user-id header passed from Clerk
        user_id = coalesce(
          nullif(current_setting('request.headers', true)::json->>'x-user-id', ''),
          nullif(current_setting('request.jwt.claims', true)::json->>'x-user-id', '')
        )
      );
  end if;

  -- Insert policy
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'resumes' 
    and policyname = 'Users can insert their own resumes'
  ) then
    create policy "Users can insert their own resumes"
      on public.resumes for insert
      with check (
        -- Use the x-user-id header passed from Clerk
        user_id = coalesce(
          nullif(current_setting('request.headers', true)::json->>'x-user-id', ''),
          nullif(current_setting('request.jwt.claims', true)::json->>'x-user-id', '')
        )
      );
  end if;

  -- Delete policy
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'resumes' 
    and policyname = 'Users can delete their own resumes'
  ) then
    create policy "Users can delete their own resumes"
      on public.resumes for delete
      using (
        -- Use the x-user-id header passed from Clerk
        user_id = coalesce(
          nullif(current_setting('request.headers', true)::json->>'x-user-id', ''),
          nullif(current_setting('request.jwt.claims', true)::json->>'x-user-id', '')
        )
      );
  end if;

  -- Update policy
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' 
    and tablename = 'resumes' 
    and policyname = 'Users can update their own resumes'
  ) then
    create policy "Users can update their own resumes"
      on public.resumes for update
      using (
        -- Use the x-user-id header passed from Clerk
        user_id = coalesce(
          nullif(current_setting('request.headers', true)::json->>'x-user-id', ''),
          nullif(current_setting('request.jwt.claims', true)::json->>'x-user-id', '')
        )
      );
  end if;
end $$;

-- Add updated_at trigger
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Add trigger if it doesn't exist
do $$
begin
  if not exists (
    select 1 from pg_trigger
    where tgname = 'set_updated_at'
    and tgrelid = 'public.resumes'::regclass
  ) then
    create trigger set_updated_at
      before update on public.resumes
      for each row
      execute function public.handle_updated_at();
  end if;
end $$;
