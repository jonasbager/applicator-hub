import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/clerk-react';
import { useMemo } from 'react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('Missing Supabase URL');
if (!supabaseKey) throw new Error('Missing Supabase Anon Key');

// Create a hook to get an authenticated client
export function useSupabase() {
  const { getToken } = useAuth();
  
  const client = useMemo(() => {
    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        fetch: async (url, options: RequestInit = {}) => {
          const token = await getToken({ template: 'supabase' });
          const headers = new Headers(options.headers);
          if (token) {
            headers.set('Authorization', `Bearer ${token}`);
          }
          return fetch(url, {
            ...options,
            headers
          });
        }
      }
    });

    return supabase;
  }, [getToken]); // Re-create client when getToken changes

  return { supabase: client };
}

// Create base client for non-auth usage
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});
