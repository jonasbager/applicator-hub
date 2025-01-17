import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useSupabase } from '../lib/supabase';
import { findMatchingJobs } from '../lib/job-matching';
import { useToast } from '../components/ui/use-toast';
import { Loader2, RefreshCw } from 'lucide-react';
import { RecommendedJob, convertToBoardJob } from '../types/recommended-job';
import { JobPreferences } from '../types/resume';
import { RecommendedJobCard } from '../components/RecommendedJobCard';
import { JobDetailsModal } from '../components/JobDetailsModal';
import { AddJobModal } from '../components/AddJobModal';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Job } from '../types/job';
import { AppSidebar } from '../components/AppSidebar';

export default function RecommendedJobs() {
  const { user } = useUser();
  const { supabase } = useSupabase();
  const navigate = useNavigate();
  
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [preferences, setPreferences] = useState<JobPreferences | null>(null);
  const [selectedJob, setSelectedJob] = useState<RecommendedJob | null>(null);
  const [showJobDetails, setShowJobDetails] = useState(false);
  const [savedJobs, setSavedJobs] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const [showAddModal, setShowAddModal] = useState(false);
  const [jobToAdd, setJobToAdd] = useState<RecommendedJob | null>(null);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  async function loadData(refresh = false) {
    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      // Load preferences
      const { data: prefs } = await supabase
        .from('job_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .single();
      
      setPreferences(prefs);

      // Load saved jobs
      const { data: saved } = await supabase
        .from('saved_jobs')
        .select('job_id')
        .eq('user_id', user!.id);
      
      setSavedJobs(saved?.map((s: { job_id: string }) => s.job_id) || []);

      // Load recommended jobs
      if (refresh && prefs) {
        // Find new matching jobs
        const newJobs = await findMatchingJobs(user!.id, prefs);
        setJobs(newJobs);
        toast({
          title: "Success",
          description: "Found new job matches based on your preferences",
        });
      } else {
        // Load existing jobs
        const { data: recommendedJobs } = await supabase
          .from('recommended_jobs')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false });

        setJobs(recommendedJobs || []);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      if (refresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  }

  async function toggleSaveJob(jobId: string) {
    if (!user) return;

    if (savedJobs.includes(jobId)) {
      // Remove from saved
      await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', user.id)
        .eq('job_id', jobId);
      setSavedJobs(savedJobs.filter(id => id !== jobId));
    } else {
      // Add to saved
      await supabase
        .from('saved_jobs')
        .insert({ user_id: user.id, job_id: jobId });
      setSavedJobs([...savedJobs, jobId]);
    }
  }

  function handleAddToBoard(job: RecommendedJob) {
    setJobToAdd(job);
    setShowAddModal(true);
  }

  if (!user) {
    navigate('/sign-in');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex w-full">
        <AppSidebar onAddClick={() => setShowAddModal(true)} hasJobs={true} />
        <main className="flex-1 p-8">
          <div className="p-8">Loading...</div>
        </main>
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen flex w-full">
        <AppSidebar onAddClick={() => setShowAddModal(true)} hasJobs={true} />
        <main className="flex-1 p-8">
          <div className="p-8">
            <h1 className="text-2xl font-bold mb-4">Welcome!</h1>
            <p className="mb-4">To get started, upload your resume and set your job preferences.</p>
            <Button onClick={() => navigate('/profile')}>Set Up Profile</Button>
          </div>
        </main>
      </div>
    );
  }

  const jobForModal = selectedJob ? convertToBoardJob(selectedJob, user.id) : null;
  const boardJob: Job = jobForModal ? {
    ...jobForModal,
    id: selectedJob!.id // Use non-null assertion since we know selectedJob exists here
  } : {
    id: '',
    user_id: user.id,
    position: '',
    company: '',
    description: '',
    keywords: [],
    url: '',
    status: 'Not Started',
    notes: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar onAddClick={() => setShowAddModal(true)} hasJobs={true} />
      <main className="flex-1 p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">Recommended Jobs</h1>
              <p className="text-muted-foreground">
                Jobs matching your preferences and skills
              </p>
            </div>
            <Button
              onClick={() => loadData(true)}
              disabled={refreshing}
              className="gap-2"
            >
              {refreshing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
              Find New Matches
            </Button>
          </div>

          {/* Filters */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4">Filtering by:</h2>
            <div className="flex flex-wrap gap-2">
              {preferences?.level?.map((level: string) => (
                <Badge key={level} variant="secondary">{level}</Badge>
              ))}
              {preferences?.roles?.map((role: string) => (
                <Badge key={role} variant="secondary">{role}</Badge>
              ))}
              {preferences?.locations?.map((location: string) => (
                <Badge key={location} variant="secondary">{location}</Badge>
              ))}
            </div>
          </div>

          {/* Jobs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) => (
              <RecommendedJobCard
                key={job.id}
                job={job}
                isSaved={savedJobs.includes(job.id)}
                onSave={toggleSaveJob}
                onAddToBoard={handleAddToBoard}
                onClick={() => {
                  setSelectedJob(job);
                  setShowJobDetails(true);
                }}
              />
            ))}
          </div>
        </div>

        {/* Job Details Modal */}
        <JobDetailsModal
          open={showJobDetails}
          onOpenChange={setShowJobDetails}
          job={boardJob}
        />

        {/* Add to Board Modal */}
        <AddJobModal
          open={showAddModal}
          onOpenChange={(open) => {
            if (!open) {
              setShowAddModal(false);
              setJobToAdd(null);
            }
          }}
          onJobAdded={() => {
            loadData();
            navigate('/jobs');
          }}
        />
      </main>
    </div>
  );
}
