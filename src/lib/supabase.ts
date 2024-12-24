import { createClient } from '@supabase/supabase-js';

if (!import.meta.env.VITE_SUPABASE_URL) {
  throw new Error('Missing Supabase URL');
}

if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
  throw new Error('Missing Supabase Anon Key');
}

// Create Supabase client with anon key (for database only)
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      // Disable Supabase Auth since we're using Clerk
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);
