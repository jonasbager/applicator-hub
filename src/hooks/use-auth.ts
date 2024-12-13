import { useContext, useEffect } from 'react';
import { AuthContext } from '../lib/auth-context';

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth() {
  const auth = useAuth();

  useEffect(() => {
    if (!auth.loading && !auth.user) {
      // Redirect to login page
      window.location.href = '/auth/login';
    }
  }, [auth.user, auth.loading]);

  return auth;
}
