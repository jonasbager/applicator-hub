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
        const error = params.get('error') || hashParams.get('error');
        const error_description = params.get('error_description') || hashParams.get('error_description');
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

        // Get current session (PKCE flow already handled by Supabase)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          navigate('/auth/login', { replace: true });
          return;
        }

        // No session means something went wrong
        if (!session) {
          console.error('No session found');
          navigate('/auth/login', { replace: true });
          return;
        }

        // Check if this is a recovery flow
        if (type === 'recovery') {
          console.log('Recovery flow detected');
          
          // Set flag and redirect
          await supabase.auth.updateUser({
            data: { passwordResetRedirected: true }
          });

          // Redirect to reset password page with type parameter
          navigate('/auth/reset-password?type=recovery', { replace: true });
          return;
        }

        // Normal sign in flow
        console.log('Session verified, redirecting to dashboard');
        toast({
          title: "Successfully signed in",
          description: "Welcome back!",
        });
        navigate('/dashboard', { replace: true });
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
