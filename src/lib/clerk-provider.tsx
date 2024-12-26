import { SignedIn, SignedOut, useAuth } from '@clerk/clerk-react';
import { Navigate } from 'react-router-dom';

interface Props {
  children: React.ReactNode;
}

/**
 * Protected route component
 * Only renders children when authenticated
 */
export function Protected({ children }: Props) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isSignedIn) {
    return <Navigate to="/sign-in" replace />;
  }

  return <SignedIn>{children}</SignedIn>;
}

/**
 * Public route component
 * Only renders children when not authenticated
 */
export function Public({ children }: Props) {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (isSignedIn) {
    return <Navigate to="/jobs" replace />;
  }

  return <SignedOut>{children}</SignedOut>;
}
