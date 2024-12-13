import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    // Handle both code and hash fragment auth methods
    const handleAuth = async () => {
      // Check for code in URL (OAuth)
      const code = new URLSearchParams(window.location.search).get('code');
      // Check for hash fragment (token)
      const hashFragment = window.location.hash;
      const accessToken = hashFragment ? new URLSearchParams(hashFragment.substring(1)).get('access_token') : null;

      if (code) {
        // Let Supabase handle the OAuth code
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (error) {
          console.error('Error exchanging code for session:', error);
        } else {
          navigate('/');
        }
      } else if (accessToken) {
        // Handle token-based auth
        const refreshToken = new URLSearchParams(hashFragment.substring(1)).get('refresh_token') || '';
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        
        if (error) {
          console.error('Error setting session:', error);
        } else {
          navigate('/');
        }
      }
    };

    handleAuth();

    // Also listen for auth state changes
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
