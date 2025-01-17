-- Enable RLS
alter table job_preferences enable row level security;

-- Allow users to read their own preferences
create policy "Users can read their own preferences"
  on job_preferences
  for select
  using (auth.uid()::text = user_id);

-- Allow users to update their own preferences
create policy "Users can update their own preferences"
  on job_preferences
  for update
  using (auth.uid()::text = user_id);

-- Allow users to insert their own preferences
create policy "Users can insert their own preferences"
  on job_preferences
  for insert
  with check (auth.uid()::text = user_id);

-- Allow service role to manage all preferences
create policy "Service role can manage all preferences"
  on job_preferences
  using (auth.role() = 'service_role');
