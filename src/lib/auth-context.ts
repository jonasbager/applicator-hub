import { createContext } from 'react';
import { User } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: null;  // Changed from AuthError to null since we handle errors via toast
}

interface AuthContextType extends AuthState {
  // Changed method signatures to match Clerk implementation
  signUp: () => Promise<void>;
  signIn: () => Promise<void>;
  signInWithLinkedIn: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
