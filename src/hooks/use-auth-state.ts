import { useAuth } from './use-auth';

export const useAuthState = () => {
  const { user, loading } = useAuth();

  return {
    isLoaded: !loading,
    isAuthenticated: !!user,
    userId: user?.id ?? null,
  };
};
