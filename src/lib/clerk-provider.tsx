import {
  ClerkProvider,
  ClerkLoaded,
  ClerkLoading,
  SignedIn,
  SignedOut,
  useAuth
} from '@clerk/clerk-react';
import { Loader2 } from 'lucide-react';

// Get environment variables
const publishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// Ensure we have required configuration
if (!publishableKey) {
  console.error('Missing Clerk configuration. Please check your environment variables.');
}

interface Props {
  children: React.ReactNode;
}

/**
 * Provides Clerk authentication context to the app
 * Handles loading states and theme synchronization
 */
export function AuthProvider({ children }: Props) {
  // Show error UI if configuration is missing
  if (!publishableKey) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-4 text-center">
        <h1 className="text-xl font-semibold text-destructive">Authentication Error</h1>
        <p className="text-muted-foreground">
          Missing authentication configuration. Please check your environment variables.
        </p>
      </div>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      appearance={{
        // Use system colors instead of Clerk themes for better integration
        variables: {
          colorPrimary: 'hsl(var(--primary))',
          colorTextOnPrimaryBackground: 'hsl(var(--primary-foreground))',
          colorBackground: 'hsl(var(--background))',
          colorText: 'hsl(var(--foreground))',
          colorInputBackground: 'hsl(var(--background))',
          colorInputText: 'hsl(var(--foreground))',
          colorTextSecondary: 'hsl(var(--muted-foreground))',
          colorDanger: 'hsl(var(--destructive))',
          borderRadius: 'var(--radius)'
        },
        elements: {
          card: 'bg-background border-border shadow-none',
          navbar: 'bg-background border-border',
          headerTitle: 'text-foreground',
          headerSubtitle: 'text-muted-foreground',
          socialButtonsBlockButton: 'bg-muted text-foreground border-border hover:bg-muted/80',
          socialButtonsBlockButtonText: 'text-foreground',
          dividerLine: 'bg-border',
          dividerText: 'text-muted-foreground',
          formButtonPrimary: 'bg-primary text-primary-foreground hover:bg-primary/90',
          formFieldLabel: 'text-foreground',
          formFieldInput: 'bg-background border-input',
          formFieldInputPlaceholder: 'text-muted-foreground',
          formFieldError: 'text-destructive',
          footerActionLink: 'text-primary hover:text-primary/90',
          identityPreviewText: 'text-foreground',
          identityPreviewEditButton: 'text-primary hover:text-primary/90',
          userPreviewMainIdentifier: 'text-foreground',
          userPreviewSecondaryIdentifier: 'text-muted-foreground',
          userButtonPopoverCard: 'bg-background border-border',
          userButtonPopoverActionButton: 'text-foreground hover:bg-muted',
          userButtonPopoverActionButtonText: 'text-foreground',
          avatarBox: 'text-foreground'
        }
      }}
    >
      <ClerkLoading>
        <div className="flex min-h-screen items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </ClerkLoading>
      <ClerkLoaded>{children}</ClerkLoaded>
    </ClerkProvider>
  );
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

/**
 * Hook to get the current auth state
 * Provides a simpler interface than Clerk's useAuth
 */
export function useAuthState() {
  const { isLoaded, isSignedIn, userId } = useAuth();
  
  return {
    isLoaded,
    isAuthenticated: isLoaded && isSignedIn,
    userId
  };
}
