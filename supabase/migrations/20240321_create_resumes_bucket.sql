-- Create resumes bucket if it doesn't exist
insert into storage.buckets (id, name, public)
select 'resumes', 'resumes', false
where not exists (
  select 1 from storage.buckets where id = 'resumes'
);

-- Enable RLS on storage.objects if not already enabled
alter table storage.objects enable row level security;

-- Create policies if they don't exist
do $$
begin
  -- Upload policy
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'Allow resume uploads'
  ) then
    create policy "Allow resume uploads"
      on storage.objects for insert
      with check (
        bucket_id = 'resumes' and
        auth.role() = 'anon'
      );
  end if;

  -- View policy
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'Allow resume downloads'
  ) then
    create policy "Allow resume downloads"
      on storage.objects for select
      using (
        bucket_id = 'resumes' and
        auth.role() = 'anon'
      );
  end if;

  -- Delete policy
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'Allow resume deletions'
  ) then
    create policy "Allow resume deletions"
      on storage.objects for delete
      using (
        bucket_id = 'resumes' and
        auth.role() = 'anon'
      );
  end if;
end $$;
