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
        const code = params.get('code');
        
        // Log URL parameters for debugging
        console.log('URL params:', {
          type,
          code: code ? '[REDACTED]' : undefined,
          search: window.location.search,
          hash: window.location.hash.replace(/token=[^&]+/g, 'token=[REDACTED]'),
          href: window.location.href.replace(/token=[^&]+/g, 'token=[REDACTED]')
        });

        // If it's a recovery flow
        if (type === 'recovery') {
          console.log('Recovery flow detected');
          
          // Sign out any existing session first
          await supabase.auth.signOut();

          // Wait for Supabase to initialize
          await new Promise(resolve => setTimeout(resolve, 100));

          // Get the recovery session
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          if (sessionError) {
            console.error('Error getting recovery session:', sessionError);
            throw sessionError;
          }

          if (!session) {
            console.error('No recovery session found');
            throw new Error('No recovery session found');
          }

          // Update user metadata to indicate recovery flow
          const { error: updateError } = await supabase.auth.updateUser({
            data: { 
              passwordResetRedirected: true,
              recoveryFlow: true
            }
          });

          if (updateError) {
            console.error('Error updating user metadata:', updateError);
            throw updateError;
          }

          // Now redirect to reset password
          console.log('Redirecting to reset password');
          navigate('/auth/reset-password?type=recovery', { replace: true });
          return;
        }

        // For non-recovery flows, handle normal auth
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
