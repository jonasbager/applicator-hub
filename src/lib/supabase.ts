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
  
  // Create a new client instance with the user ID
  const client = useMemo(() => {
    // Create base headers
    const baseHeaders: Record<string, string> = {
      'Authorization': `Bearer ${supabaseKey}`,
      'apikey': supabaseKey
    };

    // Add user ID if available
    if (userId) {
      baseHeaders['x-user-id'] = userId;
    }

    const client = createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false
      },
      global: { 
        headers: baseHeaders
      }
    });

    // Add debug interceptor
    const { fetch: originalFetch } = window;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      
      // Only intercept Supabase requests
      if (url.includes(supabaseUrl)) {
        // Create new config with merged headers
        const newConfig: RequestInit = {
          ...init,
          headers: {
            ...baseHeaders,
            ...(init?.headers as Record<string, string> || {})
          }
        };
        
        // Log request details
        console.group('Supabase Request');
        console.log('URL:', url);
        console.log('Method:', newConfig.method);
        console.log('Headers:', newConfig.headers);
        if (newConfig.body) {
          try {
            console.log('Body:', JSON.parse(newConfig.body as string));
          } catch (e) {
            console.log('Body:', newConfig.body);
          }
        }
        console.groupEnd();
        
        // Make request
        try {
          const response = await originalFetch(input, newConfig);
          const clonedResponse = response.clone();
          
          // Log response details
          try {
            const data = await clonedResponse.json();
            console.group('Supabase Response');
            console.log('Status:', response.status, response.statusText);
            console.log('Headers:', Object.fromEntries(response.headers));
            console.log('Data:', data);
            console.groupEnd();
          } catch (e) {
            console.log('Supabase Response:', {
              status: response.status,
              statusText: response.statusText,
              headers: Object.fromEntries(response.headers)
            });
          }
          
          return response;
        } catch (error) {
          console.error('Supabase Error:', error);
          throw error;
        }
      }
      
      return originalFetch(input, init);
    };

    return client;
  }, [userId]);

  return { supabase: client };
}

// Create base client for non-auth usage
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  }
});
