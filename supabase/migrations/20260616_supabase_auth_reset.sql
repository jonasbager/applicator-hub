-- Clean-slate reset for native Supabase Auth (replaces the Clerk bridge).
--
-- Identity now comes from Supabase Auth, so RLS uses `auth.uid()` directly and
-- `user_id` columns become uuid FKs to `auth.users`. There is no production data
-- worth keeping, so user-scoped tables (and the resumes bucket) are truncated;
-- users re-register under Supabase Auth.
--
-- Destructive: this TRUNCATEs user data. Run once, after the app code is ready.

-- 1. Drop every existing policy on the affected tables (clears the Clerk-era
--    debug pile and frees the user_id columns for the type change).
do $$
declare
  tbl text;
  pol record;
  affected text[] := array[
    'jobs', 'job_preferences', 'resumes', 'job_snapshots',
    'recommended_jobs', 'linkedin_jobs'
  ];
begin
  foreach tbl in array affected loop
    if to_regclass('public.' || tbl) is null then continue; end if;
    execute format('alter table public.%I enable row level security', tbl);
    for pol in select policyname from pg_policies
               where schemaname = 'public' and tablename = tbl loop
      execute format('drop policy if exists %I on public.%I', pol.policyname, tbl);
    end loop;
  end loop;
end $$;

-- 2. Wipe user-scoped data (cascades to dependent rows) and the resumes bucket.
truncate table public.jobs, public.job_preferences, public.resumes,
               public.job_snapshots, public.recommended_jobs
  restart identity cascade;
delete from storage.objects where bucket_id = 'resumes';

-- 3. Convert user_id to uuid and re-point the FK at auth.users.
do $$
declare
  tbl text;
  con record;
  per_user text[] := array['jobs', 'job_preferences', 'resumes', 'job_snapshots'];
begin
  foreach tbl in array per_user loop
    if to_regclass('public.' || tbl) is null then continue; end if;
    -- Drop any existing FK on user_id that points at auth.users (old type).
    for con in select conname from pg_constraint
               where conrelid = ('public.' || tbl)::regclass
                 and contype = 'f'
                 and confrelid = 'auth.users'::regclass loop
      execute format('alter table public.%I drop constraint if exists %I', tbl, con.conname);
    end loop;
    execute format('alter table public.%I alter column user_id type uuid using user_id::uuid', tbl);
    execute format('alter table public.%I alter column user_id set not null', tbl);
    execute format(
      'alter table public.%I add constraint %I foreign key (user_id) references auth.users(id) on delete cascade',
      tbl, tbl || '_user_id_fkey');
  end loop;
end $$;

-- 4. The Clerk-era identity helper is no longer needed.
drop function if exists current_user_id();

-- 5. Per-user policies via native auth.uid().
do $$
declare
  tbl text;
  per_user text[] := array['jobs', 'job_preferences', 'resumes', 'job_snapshots'];
begin
  foreach tbl in array per_user loop
    if to_regclass('public.' || tbl) is null then continue; end if;
    execute format(
      'create policy %I on public.%I for select to authenticated using (auth.uid() = user_id)',
      tbl || '_select_own', tbl);
    execute format(
      'create policy %I on public.%I for insert to authenticated with check (auth.uid() = user_id)',
      tbl || '_insert_own', tbl);
    execute format(
      'create policy %I on public.%I for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      tbl || '_update_own', tbl);
    execute format(
      'create policy %I on public.%I for delete to authenticated using (auth.uid() = user_id)',
      tbl || '_delete_own', tbl);
  end loop;
end $$;

-- 6. Shared catalogs: any signed-in user may read; writes go through the
--    service-role key (which bypasses RLS).
do $$
declare
  tbl text;
  catalog text[] := array['recommended_jobs', 'linkedin_jobs'];
begin
  foreach tbl in array catalog loop
    if to_regclass('public.' || tbl) is null then continue; end if;
    execute format(
      'create policy %I on public.%I for select to authenticated using (true)',
      tbl || '_select_authenticated', tbl);
  end loop;
end $$;

-- 7. Storage: resumes bucket objects are keyed by `<user_id>/...`.
do $$
declare
  pol record;
begin
  for pol in select policyname from pg_policies
             where schemaname = 'storage' and tablename = 'objects'
               and policyname ilike '%resume%' loop
    execute format('drop policy if exists %I on storage.objects', pol.policyname);
  end loop;
end $$;

create policy "resumes_select_own"
  on storage.objects for select to authenticated
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "resumes_insert_own"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'resumes'
    and auth.uid()::text = (storage.foldername(name))[1]
    and storage.extension(name) in ('pdf', 'doc', 'docx')
  );

create policy "resumes_update_own"
  on storage.objects for update to authenticated
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "resumes_delete_own"
  on storage.objects for delete to authenticated
  using (bucket_id = 'resumes' and auth.uid()::text = (storage.foldername(name))[1]);
