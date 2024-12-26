import { SignedIn, SignedOut } from '@clerk/clerk-react';

interface Props {
  children: React.ReactNode;
}

/**
 * Protected route component
 * Only renders children when authenticated
 */
export function Protected({ children }: Props) {
  return (
    <SignedIn>
      {children}
    </SignedIn>
  );
}

/**
 * Public route component
 * Only renders children when not authenticated
 */
export function Public({ children }: Props) {
  return (
    <SignedOut>
      {children}
    </SignedOut>
  );
}
