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
        // Check for type parameter (recovery, signup, etc.)
        const type = new URLSearchParams(window.location.search).get('type');
        console.log('Auth callback type:', type);

        // Handle password reset flow
        if (type === 'recovery') {
          // Get the access token from the URL
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (!accessToken) {
            throw new Error('No access token found in recovery URL');
          }

          // Set the recovery session
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) {
            throw sessionError;
          }

          // Redirect to password reset page
          toast({
            title: "Ready to reset password",
            description: "Please enter your new password.",
          });
          navigate('/auth/reset-password', { replace: true });
          return;
        }

        // Get code from URL (for email confirmation, OAuth, etc.)
        const code = new URLSearchParams(window.location.search).get('code');
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
              console.error('No session found after setting');
              throw new Error('Failed to establish session');
            }
            return;
          }
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
