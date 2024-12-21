import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useToast } from '../../components/ui/use-toast';

export default function AuthCallback() {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const handleAuth = async () => {
      try {
        // First check if this is a recovery flow
        const params = new URLSearchParams(window.location.search);
        const type = params.get('type');
        console.log('Auth callback type:', type);

        // If this is a recovery flow, redirect to reset password with the hash
        if (type === 'recovery') {
          const hash = window.location.hash;
          navigate(`/auth/reset-password${hash}`, { replace: true });
          return;
        }

        // Get code from URL (for email confirmation, OAuth, etc.)
        const code = params.get('code');
        if (code) {
          console.log('Found auth code, exchanging for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code for session:', error);
            throw error;
          }
          console.log('Successfully exchanged code for session:', data);

          // Wait a moment for the session to be properly set
          await new Promise(resolve => setTimeout(resolve, 1000));

          // Verify we have a session before redirecting
          const { data: { session } } = await supabase.auth.getSession();
          if (session) {
            console.log('Session verified, redirecting to dashboard');
            toast({
              title: "Successfully signed in",
              description: "Welcome back!",
            });
            navigate('/dashboard', { replace: true });
          } else {
            console.error('No session found after exchange');
            throw new Error('Failed to establish session');
          }
          return;
        }

        // If we get here, check if we already have a valid session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('Found existing session, redirecting to dashboard');
          navigate('/dashboard', { replace: true });
          return;
        }

        // If we get here, no valid auth data was found
        console.error('No valid authentication data found');
        console.log('URL:', window.location.href);
        console.log('Search params:', window.location.search);
        console.log('Hash:', window.location.hash);
        navigate('/auth/login', { replace: true });
      } catch (error) {
        console.error('Authentication error:', error);
        toast({
          variant: "destructive",
          title: "Authentication Error",
          description: error instanceof Error ? error.message : "Failed to authenticate",
        });
        navigate('/auth/login', { replace: true });
      }
    };

    handleAuth();
  }, [navigate, toast]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
}
