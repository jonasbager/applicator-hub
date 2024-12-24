import { createClient } from '@supabase/supabase-js';
import { useUser } from '@clerk/clerk-react';
import { useToast } from '../components/ui/use-toast';
import { Job } from '../types/job';

// Initialize Supabase client (database only, no auth)
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      persistSession: false, // We'll handle auth with Clerk
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  }
);

/**
 * Bridge between Clerk auth and Supabase database.
 * Handles all database operations that require user context.
 */
export class AuthBridge {
  private userId: string;
  private toast: ReturnType<typeof useToast>['toast'];

  constructor(userId: string, toast: ReturnType<typeof useToast>['toast']) {
    this.userId = userId;
    this.toast = toast;
  }

  /**
   * Get all non-archived jobs for the current user
   */
  async getJobs() {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', this.userId)
        .is('archived', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Job[];
    } catch (error) {
      this.toast({
        title: 'Error fetching jobs',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive'
      });
      throw error;
    }
  }

  /**
   * Create a new job for the current user
   */
  async createJob(jobData: Omit<Job, 'user_id' | 'id' | 'created_at' | 'updated_at' | 'archived'>) {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .insert({
          ...jobData,
          user_id: this.userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          archived: false
        })
        .select()
        .single();

      if (error) throw error;

      this.toast({
        title: 'Job created',
        description: 'Your job has been added successfully'
      });

      return data as Job;
    } catch (error) {
      this.toast({
        title: 'Error creating job',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive'
      });
      throw error;
    }
  }

  /**
   * Update a job
   * Verifies the job belongs to the current user
   */
  async updateJob(jobId: string, updates: Partial<Omit<Job, 'id' | 'user_id' | 'created_at'>>) {
    try {
      // First verify ownership
      const { data: job, error: fetchError } = await supabase
        .from('jobs')
        .select('user_id')
        .eq('id', jobId)
        .single();

      if (fetchError) throw fetchError;
      if (!job) throw new Error('Job not found');
      if (job.user_id !== this.userId) throw new Error('Unauthorized');

      // Update the job
      const { data, error } = await supabase
        .from('jobs')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .select()
        .single();

      if (error) throw error;

      this.toast({
        title: 'Job updated',
        description: 'Your changes have been saved'
      });

      return data as Job;
    } catch (error) {
      this.toast({
        title: 'Error updating job',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive'
      });
      throw error;
    }
  }

  /**
   * Delete a job
   * Verifies the job belongs to the current user
   */
  async deleteJob(jobId: string) {
    try {
      // First verify ownership
      const { data: job, error: fetchError } = await supabase
        .from('jobs')
        .select('user_id')
        .eq('id', jobId)
        .single();

      if (fetchError) throw fetchError;
      if (!job) throw new Error('Job not found');
      if (job.user_id !== this.userId) throw new Error('Unauthorized');

      // Delete the job
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId);

      if (error) throw error;

      this.toast({
        title: 'Job deleted',
        description: 'The job has been removed'
      });
    } catch (error) {
      this.toast({
        title: 'Error deleting job',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive'
      });
      throw error;
    }
  }

  /**
   * Get archived jobs for the current user
   */
  async getArchivedJobs() {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', this.userId)
        .eq('archived', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Job[];
    } catch (error) {
      this.toast({
        title: 'Error fetching archived jobs',
        description: error instanceof Error ? error.message : 'Please try again later',
        variant: 'destructive'
      });
      throw error;
    }
  }

  /**
   * Archive/unarchive a job
   */
  async toggleJobArchive(jobId: string, archived: boolean) {
    return this.updateJob(jobId, { archived });
  }
}

/**
 * Hook to use the auth bridge
 */
export function useAuthBridge() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { toast } = useToast();

  if (!isLoaded) {
    return { bridge: null, isLoaded: false, isSignedIn: false };
  }

  return {
    bridge: isSignedIn ? new AuthBridge(user.id, toast) : null,
    isLoaded: true,
    isSignedIn
  };
}
