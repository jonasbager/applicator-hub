import { createClient } from '@supabase/supabase-js';
import { useAuth } from '@clerk/clerk-react';
import { useMemo } from 'react';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) throw new Error('Missing Supabase URL');
if (!supabaseKey) throw new Error('Missing Supabase Anon Key');

// Create a hook to get an authenticated client
export function useSupabase() {
  const { userId } = useAuth();
  
  const client = useMemo(() => {
    console.log('Creating Supabase client with userId:', userId);
    
    if (!userId) {
      console.warn('No userId available for Supabase client');
      return createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      });
    }
    
    const headers: Record<string, string> = {
      'x-user-id': userId
    };
    
    console.log('Setting Supabase headers:', headers);
    
    return createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      },
      global: {
        headers
      }
    });
  }, [userId]); // Re-create client when userId changes

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
