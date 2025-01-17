-- Enable RLS
alter table job_preferences enable row level security;

-- Allow service role full access
create policy "Service role can manage all preferences"
  on job_preferences
  using (true);

-- Allow service role to insert
create policy "Service role can insert preferences"
  on job_preferences
  for insert
  with check (true);

-- Allow service role to update
create policy "Service role can update preferences"
  on job_preferences
  for update
  using (true);
