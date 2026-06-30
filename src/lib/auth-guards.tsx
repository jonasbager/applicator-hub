import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/use-auth';

interface Props {
  children: React.ReactNode;
}

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Loading...</div>
    </div>
  );
}

/**
 * Protected route — renders children only for an authenticated user,
 * otherwise redirects to sign-in.
 */
export function Protected({ children }: Props) {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (!user) return <Navigate to="/sign-in" replace />;

  return <>{children}</>;
}

/**
 * Public route — for auth pages. Redirects authenticated users to the app.
 */
export function Public({ children }: Props) {
  const { user, loading } = useAuth();

  if (loading) return <Loading />;
  if (user) return <Navigate to="/jobs" replace />;

  return <>{children}</>;
}
