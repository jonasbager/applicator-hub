import { useUser } from '@clerk/clerk-react';
import { useToast } from '../components/ui/use-toast';
import { AuthBridge } from '../lib/auth-bridge';

interface AuthBridgeResult {
  bridge: AuthBridge | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  error: Error | null;
}

/**
 * Hook to access the auth bridge
 * Provides access to database operations in the context of the current user
 * 
 * Example usage:
 * ```tsx
 * function JobList() {
 *   const { bridge, isLoaded } = useAuthBridge();
 *   const [jobs, setJobs] = useState([]);
 * 
 *   useEffect(() => {
 *     if (bridge) {
 *       bridge.getJobs().then(setJobs);
 *     }
 *   }, [bridge]);
 * 
 *   if (!isLoaded) return <div>Loading...</div>;
 *   if (!bridge) return <div>Please sign in</div>;
 * 
 *   return (
 *     <div>
 *       {jobs.map(job => (
 *         <JobCard 
 *           key={job.id} 
 *           job={job}
 *           onArchive={() => bridge.toggleJobArchive(job.id, true)}
 *         />
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useAuthBridge(): AuthBridgeResult {
  const { user, isLoaded, isSignedIn } = useUser();
  const { toast } = useToast();
  
  if (!isLoaded) {
    return { 
      bridge: null, 
      isLoaded: false, 
      isSignedIn: false,
      error: null
    };
  }

  try {
    return {
      bridge: isSignedIn ? new AuthBridge(user.id, toast) : null,
      isLoaded: true,
      isSignedIn,
      error: null
    };
  } catch (error) {
    return {
      bridge: null,
      isLoaded: true,
      isSignedIn: false,
      error: error as Error
    };
  }
}

/**
 * Hook to require auth bridge
 * Use this when you know the component will only be rendered when authenticated
 * Throws an error if not authenticated
 */
export function useRequiredAuthBridge(): Omit<AuthBridgeResult, 'bridge'> & { bridge: AuthBridge } {
  const result = useAuthBridge();

  if (!result.isLoaded) {
    throw new Error('Auth not loaded');
  }

  if (!result.bridge) {
    throw new Error('Not authenticated');
  }

  return result as Omit<AuthBridgeResult, 'bridge'> & { bridge: AuthBridge };
}
