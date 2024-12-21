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
        // Get code and type from URL
        const params = new URLSearchParams(window.location.search);
        const code = params.get('code');
        const type = params.get('type');
        const error = params.get('error');
        const error_description = params.get('error_description');

        // Log URL parameters for debugging
        console.log('URL params:', {
          code,
          type,
          error,
          error_description,
          hash: window.location.hash,
          search: window.location.search,
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

        // Handle recovery flow
        if (type === 'recovery') {
          // Get the recovery token from the URL
          const fragment = window.location.hash;
          if (!fragment) {
            console.error('No recovery token found');
            navigate('/auth/login', { replace: true });
            return;
          }

          // Parse the token from the URL fragment
          const hashParams = new URLSearchParams(fragment.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');

          if (!accessToken) {
            console.error('Invalid recovery token');
            navigate('/auth/login', { replace: true });
            return;
          }

          // Set the recovery session
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError || !session) {
            console.error('Error setting recovery session:', sessionError);
            navigate('/auth/login', { replace: true });
            return;
          }

          // Verify we have a user
          const { data: { user }, error: userError } = await supabase.auth.getUser();
          if (userError || !user) {
            console.error('Error getting user:', userError);
            navigate('/auth/login', { replace: true });
            return;
          }

          console.log('Recovery session established for user:', user.email);

          // Redirect to reset password page
          navigate('/auth/reset-password', { replace: true });
          return;
        }

        // Handle code exchange
        if (code) {
          console.log('Found auth code, exchanging for session...');
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error('Error exchanging code for session:', error);
            throw error;
          }
          console.log('Successfully exchanged code for session:', data);

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
