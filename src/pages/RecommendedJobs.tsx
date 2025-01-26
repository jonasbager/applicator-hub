import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { AppSidebar } from '../components/AppSidebar';
import { RecommendedJobCard } from '../components/RecommendedJobCard';
import { Button } from '../components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '../components/ui/use-toast';
import { getUserId } from '../lib/user-id';
import { JobMatch } from '../types/recommended-job';
import { Spinner } from '../components/ui/spinner';

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
      const userId = getUserId(user.id);
      console.log('Fetching jobs for user:', userId);

      const functionPath = '/.netlify/functions/find-matching-jobs';
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}${functionPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: userId,
        }),
      });

      const data = await response.json();
      console.log('Response from find-matching-jobs:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        data: JSON.stringify(data, null, 2)
      });

      if (!response.ok) {
        throw new Error(
          `Failed to fetch matching jobs: ${response.status} ${response.statusText}\n` +
          `Details: ${data.details || data.error || 'No error details provided'}`
        );
      }

      if (data.message) {
        console.log('Server message:', data.message);
        toast({
          title: 'Note',
          description: data.message
        });
      }

      if (!Array.isArray(data.jobs)) {
        console.error('Invalid jobs data:', {
          type: typeof data.jobs,
          value: data.jobs,
          fullResponse: data
        });
        throw new Error('Invalid response format: jobs is not an array');
      }

      setJobs(data.jobs);
      console.log('Jobs found:', {
        count: data.jobs.length,
        jobs: data.jobs.map((job: JobMatch) => ({
          title: job.title,
          company: job.company,
          similarity: job.similarity
        }))
      });
    } catch (error) {
      console.error('Error fetching jobs:', {
        error,
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      });
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
                <Spinner className="h-4 w-4" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Refresh Jobs
            </Button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Spinner className="h-8 w-8" />
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
