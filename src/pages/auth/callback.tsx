import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Get the hash fragment from the URL
    const hashFragment = window.location.hash;
    const accessToken = new URLSearchParams(hashFragment.substring(1)).get('access_token');

    if (accessToken) {
      // Set the access token in Supabase
      supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: new URLSearchParams(hashFragment.substring(1)).get('refresh_token') || '',
      }).then(({ error }) => {
        if (error) {
          console.error('Error setting session:', error);
        } else {
          // Redirect to home page after successful auth
          navigate('/');
        }
      });
    }

    // Handle the OAuth callback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
}
