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
        // Get URL parameters
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
        const error = params.get('error') || hashParams.get('error');
        const error_description = params.get('error_description') || hashParams.get('error_description');
        const access_token = hashParams.get('access_token');
        const refresh_token = hashParams.get('refresh_token');
        const type = params.get('type') || hashParams.get('type');

        // Log URL parameters for debugging
        console.log('URL params:', {
          error,
          error_description,
          type,
          search: window.location.search,
          hash: window.location.hash,
          href: window.location.href
        });

        // Handle errors
        if (error) {
          console.error('Auth error:', error, error_description);
          toast({
            variant: "destructive",
            title: "Authentication Error",
            description: error_description || "Failed to authenticate",
          });
          navigate('/auth/login', { replace: true });
          return;
        }

        // Handle recovery flow with hash params
        if (access_token && type === 'recovery') {
          console.log('Recovery flow detected with hash params');
          
          // Set the session
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token: refresh_token || '',
          });

          if (sessionError || !session) {
            console.error('Error setting recovery session:', sessionError);
            navigate('/auth/login', { replace: true });
            return;
          }

          // Set flag and redirect
          await supabase.auth.updateUser({
            data: { passwordResetRedirected: true }
          });
          navigate('/auth/reset-password', { replace: true });
          return;
        }

        // Handle normal sign in flow
        const code = params.get('code');
        if (code) {
          console.log('Found auth code, exchanging for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code for session:', error);
            throw error;
          }
          console.log('Successfully exchanged code for session:', data);

          // Get the session to check the user's state
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            console.error('No session found after exchange');
            throw new Error('Failed to establish session');
          }

          // Check if this is a recovery flow
          const { data: { user } } = await supabase.auth.getUser();
          if (user?.user_metadata?.reauthentication_token || user?.user_metadata?.passwordResetRedirected) {
            console.log('Recovery session detected, redirecting to reset password');
            navigate('/auth/reset-password', { replace: true });
            return;
          }

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
        console.error('No valid authentication data found');
        console.log('URL:', window.location.href);
        console.log('Search params:', window.location.search);
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
