import { useContext } from 'react';
import { ClerkProvider, useAuth, useUser } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/ui/use-toast';
import { AuthContext } from './auth-context';
import type { User } from '@supabase/supabase-js';

const CLERK_PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!CLERK_PUBLISHABLE_KEY) {
  throw new Error('Missing VITE_CLERK_PUBLISHABLE_KEY');
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY}>
      <AuthStateProvider>{children}</AuthStateProvider>
    </ClerkProvider>
  );
}

function AuthStateProvider({ children }: { children: React.ReactNode }) {
  const { isLoaded, signOut } = useAuth();
  const { user: clerkUser } = useUser();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Convert Clerk user to minimal Supabase user shape for compatibility
  const user: User | null = clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || '',
    created_at: clerkUser.createdAt?.toISOString() || new Date().toISOString(),
    updated_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    aud: 'authenticated',
    role: 'authenticated',
    email_confirmed_at: clerkUser.primaryEmailAddress?.emailAddress ? new Date().toISOString() : undefined,
    phone: clerkUser.primaryPhoneNumber?.phoneNumber || undefined,
    confirmation_sent_at: new Date().toISOString(),
    confirmed_at: clerkUser.createdAt?.toISOString() || new Date().toISOString(),
    last_sign_in_at: clerkUser.lastSignInAt?.toISOString() || new Date().toISOString(),
    recovery_sent_at: new Date().toISOString(),
    identities: [],
    factors: []
  } : null;

  // Provide auth state and methods through context
  const value = {
    user,
    loading: !isLoaded,
    error: null,
    signUp: async () => {
      // Handled by Clerk UI components
      toast({
        title: "Please use the sign up form",
        description: "The sign up process is handled through our secure form.",
      });
    },
    signIn: async () => {
      // Handled by Clerk UI components
      toast({
        title: "Please use the sign in form",
        description: "The sign in process is handled through our secure form.",
      });
    },
    signInWithLinkedIn: async () => {
      // Handled by Clerk UI components
      toast({
        title: "Please use the sign in form",
        description: "Social login is available through our secure form.",
      });
    },
    signOut: async () => {
      try {
        await signOut();
        toast({
          title: "Signed out",
          description: "Successfully signed out of your account.",
        });
        navigate('/');
      } catch (error) {
        console.error('Error signing out:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to sign out. Please try again.",
        });
      }
    },
    resetPassword: async () => {
      // Handled by Clerk UI components
      toast({
        title: "Please use the reset password form",
        description: "The password reset process is handled through our secure form.",
      });
    },
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// Export hook for easy access to auth context
export const useAppAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAppAuth must be used within an AuthProvider');
  }
  return context;
};
