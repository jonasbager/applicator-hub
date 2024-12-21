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
        // First, check if this is a recovery flow
        const params = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
        const type = params.get('type') || hashParams.get('type');
        
        if (type === 'recovery') {
          console.log('Recovery flow detected, redirecting to reset password');
          // Immediately redirect to reset password
          // This prevents any auto-sign-in behavior
          navigate('/auth/reset-password?type=recovery', { replace: true });
          return;
        }

        // For non-recovery flows, handle normal auth
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error('Error getting session:', error);
          navigate('/auth/login', { replace: true });
          return;
        }

        if (!session) {
          console.error('No session found');
          navigate('/auth/login', { replace: true });
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
