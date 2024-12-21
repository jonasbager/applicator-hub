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
        const type = params.get('type');
        const error = params.get('error');
        const error_description = params.get('error_description');
        const token = params.get('token');

        // Log URL parameters for debugging
        console.log('URL params:', {
          type,
          error,
          error_description,
          token,
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
        if (type === 'recovery' && token) {
          console.log('Recovery flow detected');
          
          // Exchange the token for a session
          const { data, error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: 'recovery'
          });

          if (verifyError) {
            console.error('Error verifying recovery token:', verifyError);
            toast({
              variant: "destructive",
              title: "Error",
              description: "Invalid or expired recovery link. Please request a new one.",
            });
            navigate('/auth/login', { replace: true });
            return;
          }

          console.log('Recovery token verified:', data);

          // Redirect to reset password page
          navigate('/auth/reset-password', { replace: true });
          return;
        }

        // Handle normal sign in flow (email confirmation, OAuth, etc.)
        const code = params.get('code');
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
