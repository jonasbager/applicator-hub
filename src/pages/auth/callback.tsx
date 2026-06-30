import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

// OAuth / email-confirmation landing page. With detectSessionInUrl + PKCE the
// client exchanges the code for a session automatically; we just wait for it
// and then route into the app.
export function CallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let done = false;

    const finish = (path: string) => {
      if (!done) {
        done = true;
        navigate(path, { replace: true });
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) finish('/jobs');
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) finish('/jobs');
    });

    // Fallback if no session materialises (e.g. an invalid/expired link).
    const timer = setTimeout(() => finish('/sign-in'), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, [navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="text-muted-foreground">Signing you in…</p>
      </div>
    </div>
  );
}
