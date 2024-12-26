import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useClerk } from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';

export function CallbackPage() {
  const clerk = useClerk();
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Callback page mounted, current URL:', window.location.href);
    console.log('Clerk state:', {
      loaded: clerk.loaded,
      session: clerk.session,
      client: clerk.client
    });

    async function handleCallback() {
      try {
        await clerk.handleRedirectCallback({
          redirectUrl: '/jobs'
        });
      } catch (err) {
        console.error('Error handling callback:', err);
        console.error('Current URL:', window.location.href);
        navigate('/sign-in');
      }
    }

    handleCallback();
  }, [clerk, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    </div>
  );
}
