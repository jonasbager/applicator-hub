-- Harden requesting_user_id() so RLS reliably resolves the signed-in user.
--
-- The previous version only read the aggregated `request.jwt.claims` GUC via
-- ::json. If PostgREST exposes the subject only via the individual
-- `request.jwt.claim.sub` GUC (or the aggregate parses differently), the helper
-- returned NULL — which makes every per-user INSERT fail its WITH CHECK
-- (e.g. "Failed to load preferences", new jobs not saving) while SELECTs
-- silently return nothing.
--
-- This mirrors Supabase's own auth.uid() implementation: prefer the individual
-- claim GUC, fall back to the aggregated claims JSON, and cast to uuid.
create or replace function public.requesting_user_id()
returns uuid
language sql
stable
as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub'
  )::uuid;
$$;
