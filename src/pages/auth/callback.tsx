import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // First check if we already have a session
        const { data: { session } } = await supabase.auth.getSession();
        console.log('Current session:', session);
        
        if (session) {
          console.log('Session already exists, redirecting to home');
          navigate('/');
          return;
        }

        // Get code from URL
        const code = new URLSearchParams(window.location.search).get('code');
        if (code) {
          console.log('Found auth code, exchanging for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code for session:', error);
            throw error;
          }
          console.log('Successfully exchanged code for session:', data);
          navigate('/');
          return;
        }

        // Check for hash fragment (token)
        const hashFragment = window.location.hash;
        if (hashFragment) {
          console.log('Found hash fragment, checking for access token...');
          const accessToken = new URLSearchParams(hashFragment.substring(1)).get('access_token');
          if (accessToken) {
            console.log('Setting session from access token...');
            const refreshToken = new URLSearchParams(hashFragment.substring(1)).get('refresh_token') || '';
            const { data, error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) {
              console.error('Error setting session:', error);
              throw error;
            }
            console.log('Successfully set session:', data);
            navigate('/');
            return;
          }
        }

        // If we get here, no valid auth data was found
        console.error('No valid authentication data found in URL');
        console.log('URL:', window.location.href);
        console.log('Search params:', window.location.search);
        console.log('Hash:', window.location.hash);
        navigate('/auth/login');
      } catch (error) {
        console.error('Authentication error:', error);
        navigate('/auth/login');
      }
    };

    // Add a small delay to ensure all auth state is properly initialized
    const timer = setTimeout(() => {
      handleAuth();
    }, 500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
}
