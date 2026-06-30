import { useEffect, useState } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useToast } from '../components/ui/use-toast';
import { AuthContext } from './auth-context';

// Always redirect back to the current origin so each environment (localhost,
// deploy previews, production) returns to itself. These URLs must be in the
// Supabase Auth redirect allowlist.
const SITE_URL = window.location.origin;

// Owns the auth session state and exposes the auth actions. Navigation after
// sign-in / sign-out is handled by the route guards (Protected / Public), so
// this provider only tracks state and surfaces feedback.
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const { toast } = useToast();

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (mounted) {
        setState((prev) => ({ ...prev, user: session?.user ?? null, loading: false }));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      setState((prev) => ({ ...prev, user: session?.user ?? null, loading: false }));

      if (event === 'SIGNED_IN') {
        toast({ title: 'Signed in', description: 'Welcome back!' });
      } else if (event === 'SIGNED_OUT') {
        toast({ title: 'Signed out', description: 'You have been signed out.' });
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast]);

  const handleAuthError = (error: AuthError) => {
    setState((prev) => ({ ...prev, error }));

    let description = 'Please try again.';
    if (error.message.includes('Email not confirmed')) {
      description = 'Please check your email for the confirmation link.';
    } else if (error.message.includes('Invalid login credentials')) {
      description = 'Invalid email or password.';
    } else if (error.message.toLowerCase().includes('provider')) {
      description = 'LinkedIn login is not properly configured. Please try again later.';
    }

    toast({ variant: 'destructive', title: 'Authentication error', description });
  };

  const signUp = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, error: null }));
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${SITE_URL}/auth/callback` },
      });
      if (error) throw error;
      toast({
        title: 'Verification email sent',
        description: 'Please check your email to confirm your account.',
      });
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    }
  };

  const signIn = async (email: string, password: string) => {
    setState((prev) => ({ ...prev, error: null }));
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    }
  };

  const signInWithLinkedIn = async () => {
    setState((prev) => ({ ...prev, error: null }));
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${SITE_URL}/auth/callback`,
          scopes: 'openid profile email',
        },
      });
      if (error) throw error;
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    }
  };

  const resetPassword = async (email: string) => {
    setState((prev) => ({ ...prev, error: null }));
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${SITE_URL}/reset-password`,
      });
      if (error) throw error;
      toast({
        title: 'Password reset email sent',
        description: 'Check your inbox for a link to reset your password.',
      });
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    }
  };

  const value = {
    ...state,
    signUp,
    signIn,
    signInWithLinkedIn,
    resetPassword,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

interface AuthState {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
}
