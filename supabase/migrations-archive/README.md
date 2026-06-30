# Archived migrations (pre–Supabase Auth, Clerk era)

These are the original migrations from when ApplyMate used Clerk for auth. They
are kept for historical reference only and are **not** processed by the Supabase
CLI (it only reads `supabase/migrations/`).

They were moved out of the active migrations folder because:

- They use date-only version prefixes (e.g. many `20240320_*`), which collide as
  duplicate versions and break `supabase migration list` / `db push`.
- They were applied ad‑hoc via the dashboard SQL editor, never through the CLI,
  so they are not in the remote migration history.
- Several are contradictory debug/experimental policies (`allow_all`,
  `permissive_debug`, `simple_auth`, numerous `_fix`/`_final` variants).

The current schema is the result of these plus the auth migration in
`../migrations/20260616_supabase_auth_reset.sql`, which is the only migration the
CLI tracks. The live cloud database is the source of truth.

If local-from-scratch rebuilds (`supabase db reset` / `supabase start`) are ever
needed, generate a single baseline from the live schema
(`supabase db dump`) rather than replaying these files.
