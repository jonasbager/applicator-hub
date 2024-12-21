import { createContext } from 'react';
import { User, AuthError } from '@supabase/supabase-js';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: AuthError | null;
}

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithLinkedIn: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
