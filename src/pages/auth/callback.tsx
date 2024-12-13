import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // Get code from URL
        const code = new URLSearchParams(window.location.search).get('code');
        if (code) {
          console.log('Exchanging code for session...');
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code for session:', error);
            throw error;
          }
          // Successfully authenticated
          navigate('/');
          return;
        }

        // Check for hash fragment (token)
        const hashFragment = window.location.hash;
        if (hashFragment) {
          const accessToken = new URLSearchParams(hashFragment.substring(1)).get('access_token');
          if (accessToken) {
            console.log('Setting session from access token...');
            const refreshToken = new URLSearchParams(hashFragment.substring(1)).get('refresh_token') || '';
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              console.error('Error setting session:', error);
              throw error;
            }
            // Successfully authenticated
            navigate('/');
            return;
          }
        }

        // If we get here, no valid auth data was found
        console.error('No valid authentication data found in URL');
        navigate('/auth/login');
      } catch (error) {
        console.error('Authentication error:', error);
        navigate('/auth/login');
      }
    };

    handleAuth();
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
}
