import { useContext, useEffect, useState, useRef } from 'react';
import { User, AuthError } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { useToast } from '../components/ui/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from './auth-context';

// Use production URL in production, localhost in development
const SITE_URL = import.meta.env.PROD 
  ? 'https://applymate.app'
  : 'http://localhost:3000';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<{
    user: User | null;
    loading: boolean;
    error: AuthError | null;
  }>({
    user: null,
    loading: true,
    error: null,
  });
  const { toast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const isInitialMount = useRef(true);
  const hasShownWelcomeToast = useRef(false);

  useEffect(() => {
    let mounted = true;

    // Get initial session
    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('Initial session check:', session);
        
        if (error) {
          console.error('Error getting session:', error);
          if (mounted) {
            setState(prev => ({ ...prev, error, loading: false }));
          }
          return;
        }

        if (mounted) {
          setState(prev => ({
            ...prev,
            user: session?.user ?? null,
            loading: false,
          }));

          // Only redirect if we're on the landing page and not in a recovery flow
          if (session?.user && location.pathname === '/' && !location.hash.includes('type=recovery')) {
            navigate('/dashboard');
          }
        }
      } catch (error) {
        console.error('Error during auth initialization:', error);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (!mounted) return;

      if (event === 'SIGNED_IN') {
        console.log('User signed in:', session?.user);
        setState(prev => ({
          ...prev,
          user: session?.user ?? null,
          loading: false,
        }));
        
        // Only show toast and navigate if this is a new sign in
        // and we haven't shown the welcome toast yet
        // and we're not in a recovery flow
        if (!isInitialMount.current && !hasShownWelcomeToast.current && !location.hash.includes('type=recovery')) {
          hasShownWelcomeToast.current = true;
          toast({
            title: "Successfully signed in",
            description: "Welcome back!",
          });
          navigate('/dashboard');
        }
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out');
        setState(prev => ({
          ...prev,
          user: null,
          loading: false,
        }));
        hasShownWelcomeToast.current = false; // Reset the toast flag
        toast({
          title: "Signed out",
          description: "Successfully signed out of your account.",
        });
        navigate('/');
      } else if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
        console.log('Session updated:', session);
        if (session?.user) {
          setState(prev => ({
            ...prev,
            user: session.user,
            loading: false,
          }));
          // Only navigate to dashboard if we're on the landing page
          // and not in a recovery flow
          if (location.pathname === '/' && !location.hash.includes('type=recovery')) {
            navigate('/dashboard');
          }
        }
      } else if (event === 'PASSWORD_RECOVERY') {
        // Handle password recovery event
        console.log('Password recovery event received');
        navigate('/auth/reset-password');
      }

      // After first mount, set isInitialMount to false
      if (isInitialMount.current) {
        isInitialMount.current = false;
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [toast, navigate, location.pathname, location.hash]);

  const handleAuthError = (error: AuthError) => {
    console.error('Auth error:', error);
    setState(prev => ({ ...prev, error }));
    
    let description = 'Please try again.';
    if (error.message.includes('Email not confirmed')) {
      description = 'Please check your email for the confirmation link.';
    } else if (error.message.includes('Invalid login credentials')) {
      description = 'Invalid email or password.';
    } else if (error.message.includes('provider')) {
      description = 'LinkedIn login is not properly configured. Please try again later.';
    }

    toast({
      variant: "destructive",
      title: "Authentication Error",
      description,
    });
  };

  const signUp = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${SITE_URL}/auth/callback`,
          data: {
            email_confirm_url: `${SITE_URL}/auth/callback`
          }
        },
      });
      
      if (error) throw error;

      toast({
        title: "Verification email sent",
        description: "Please check your email to confirm your account.",
      });
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signIn = async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) throw error;
      hasShownWelcomeToast.current = false; // Reset the toast flag before new sign in
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const resetPassword = async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      // Send reset password email with callback URL
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${SITE_URL}/auth/callback`,
      });
      
      if (error) throw error;

      toast({
        title: "Password reset email sent",
        description: "Please check your email for the password reset link.",
      });
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signInWithLinkedIn = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      console.log('Starting LinkedIn sign in...');
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'linkedin_oidc',
        options: {
          redirectTo: `${SUPABASE_URL}/auth/callback`,
          queryParams: {
            redirect_uri: `${SUPABASE_URL}/auth/callback`
          },
          scopes: 'openid profile email',
        },
      });
      
      if (error) throw error;
      hasShownWelcomeToast.current = false; // Reset the toast flag before new sign in
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const signOut = async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      handleAuthError(error as AuthError);
      throw error;
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  };

  const value = {
    ...state,
    signUp,
    signIn,
    signInWithLinkedIn,
    signOut,
    resetPassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
