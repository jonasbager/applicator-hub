import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { AppSidebar } from '../components/AppSidebar';
import { RecommendedJobCard } from '../components/RecommendedJobCard';
import { Button } from '../components/ui/button';
import { Loader2, RefreshCw } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import { getUserId } from '../lib/user-id';
import { JobMatch } from '../types/recommended-job';

export default function RecommendedJobs() {
  const { user } = useUser();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<JobMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchJobs = async () => {
    if (!user) return;

    try {
      setRefreshing(true);
      const response = await fetch('/.netlify/functions/find-matching-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: getUserId(user.id),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.details || 'Failed to fetch matching jobs');
      }

      const data = await response.json();
      setJobs(data.jobs);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to fetch matching jobs'
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, [user]);

  if (!user) return null;

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar onAddClick={() => {}} hasJobs={true} />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold">Recommended Jobs</h1>
            <Button
              onClick={fetchJobs}
              disabled={refreshing}
              variant="outline"
              className="gap-2"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Jobs
            </Button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : jobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {jobs.map((job) => (
                <RecommendedJobCard key={job.id} job={job} />
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">
                No recommended jobs found. Try uploading a resume or updating your preferences.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
