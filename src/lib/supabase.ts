import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('Missing Supabase URL');
if (!supabaseKey) throw new Error('Missing Supabase Anon Key');

// Single shared client. Supabase Auth manages the session (PKCE flow,
// persisted in localStorage and auto-refreshed), and every request carries the
// signed-in user's JWT, so RLS can trust `auth.uid()` server-side.
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
    storage: window.localStorage,
  },
});

// Kept for call-site compatibility: the session is global, so consumers just
// receive the shared authenticated client.
export function useSupabase() {
  return { supabase };
}
