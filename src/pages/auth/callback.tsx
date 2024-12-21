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
        // Get URL parameters from both search and hash
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
        const type = params.get('type') || hashParams.get('type');
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        
        // Log URL parameters for debugging
        console.log('URL params:', {
          type,
          access_token: access_token ? '[REDACTED]' : undefined,
          refresh_token: refresh_token ? '[REDACTED]' : undefined,
          search: window.location.search,
          hash: window.location.hash.replace(/token=[^&]+/g, 'token=[REDACTED]'),
          href: window.location.href.replace(/token=[^&]+/g, 'token=[REDACTED]')
        });

        // If it's a recovery flow with tokens
        if (type === 'recovery' && access_token) {
          console.log('Recovery flow with access token detected');
          
          // Sign out any existing session first
          await supabase.auth.signOut();

          // Set up the recovery session
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || ''
          });

          if (sessionError || !session) {
            console.error('Error setting recovery session:', sessionError);
            throw sessionError || new Error('No session created');
          }

          // Set flag and redirect
          await supabase.auth.updateUser({
            data: { passwordResetRedirected: true }
          });

          // Now redirect to reset password
          console.log('Redirecting to reset password');
          navigate('/auth/reset-password?type=recovery', { replace: true });
          return;
        }

        // For non-recovery flows, handle normal auth
        const code = params.get('code');
        if (code) {
          console.log('Found auth code, exchanging for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code for session:', error);
            throw error;
          }
          console.log('Successfully exchanged code for session:', data);

          // Normal sign in flow
          console.log('Session verified, redirecting to dashboard');
          toast({
            title: "Successfully signed in",
            description: "Welcome back!",
          });
          navigate('/dashboard', { replace: true });
          return;
        }

        // If we get here, no valid auth data was found
        console.error('No valid auth data found');
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
