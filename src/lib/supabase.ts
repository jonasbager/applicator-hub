import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/clerk-react';
import { useMemo } from 'react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('Missing Supabase URL');
if (!supabaseKey) throw new Error('Missing Supabase Anon Key');

// Create the base client
const baseClient = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  }
});

// Create a hook to get an authenticated client
export function useSupabase() {
  const { userId } = useAuth();
  
  console.log('Clerk user ID:', userId);
  
  // Create a new client instance with the user ID
  const client = useMemo(() => {
    console.log('Creating Supabase client with user ID:', userId);
    
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers: {
          'Authorization': `Bearer ${supabaseKey}`,
          'x-client-info': 'clerk-auth',
          'x-user-id': userId || ''
        }
      }
    });
  }, [userId]);

  return { supabase: client };
}

// Export the base client for non-auth usage
export const supabase = baseClient;
