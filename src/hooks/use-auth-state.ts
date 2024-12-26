import { useAuth } from '@clerk/clerk-react';

export const useAuthState = () => {
  const { isLoaded, isSignedIn, userId } = useAuth();
  
  return {
    isLoaded,
    isAuthenticated: isLoaded && isSignedIn,
    userId
  };
};
