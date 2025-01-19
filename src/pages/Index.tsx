import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { JobColumn } from "../components/JobColumn";
import { AddJobModal } from "../components/AddJobModal";
import { JobDetailsModal } from "../components/JobDetailsModal";
import { Job, JobStatus, JOB_STATUS_ORDER } from "../types/job";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { AppSidebar } from "../components/AppSidebar";
import { AnalyticsBar } from "../components/AnalyticsBar";
import { useAuth, useUser } from "@clerk/clerk-react";
import { Loader2 } from "lucide-react";
import { useToast } from "../components/ui/use-toast";
import { useSupabase } from "../lib/supabase";
import { getUserId } from "../lib/user-id";
import { cn } from "../lib/utils";

export function Index() {
  const { userId, isLoaded } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useUser();
  const { supabase } = useSupabase();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isLoaded && userId) {
      loadJobs();
    }
  }, [isLoaded, userId]);

  // Handle opening modal from navigation state
  useEffect(() => {
    const state = location.state as { openAddModal?: boolean };
    if (state?.openAddModal) {
      setIsAddModalOpen(true);
      // Clear the state to prevent reopening on subsequent renders
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const loadJobs = async () => {
    if (!userId) return;
    
    try {
      const { data: fetchedJobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', getUserId(userId))
        .is('archived', false) // Only get non-archived jobs
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      if (error) throw error;
      setJobs(fetchedJobs || []);
    } catch (error) {
      console.error("Error loading jobs:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load jobs",
      });
    } finally {
      setInitialLoading(false);
    }
  };

  const handleJobUpdate = async (updatedJob: Job) => {
    // First update the local state optimistically
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job.id === updatedJob.id ? updatedJob : job
      )
    );

    // Then reload jobs from the server to ensure we have the latest data
    await loadJobs();
  };

  const handleJobDelete = (jobId: string) => {
    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
  };

  const onDragEnd = async (result: DropResult) => {
    if (!userId) return;
    
    const { source, destination, draggableId } = result;
    
    if (!destination || (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )) {
      return;
    }

    const newStatus = destination.droppableId as JobStatus;
    setIsUpdating(true);
    
    // Optimistically update the UI
    setJobs(prevJobs => {
      const jobToMove = prevJobs.find(job => job.id === draggableId);
      if (!jobToMove) return prevJobs;

      // Create a new array without the moved job
      const newJobs = prevJobs.filter(job => job.id !== draggableId);

      // Create updated job with new status while preserving all other fields
      const updatedJob = {
        ...jobToMove,
        status: newStatus,
        notes: jobToMove.notes || [],
        application_draft_url: jobToMove.application_draft_url || '',
      };

      // Get jobs of the destination status
      const destinationJobs = newJobs.filter(
        job => job.status === newStatus
      );

      // Insert the job at the new position
      destinationJobs.splice(destination.index, 0, updatedJob);

      // Reconstruct the jobs array maintaining status order
      return JOB_STATUS_ORDER.flatMap(status => 
        status === newStatus
          ? destinationJobs
          : newJobs.filter(job => job.status === status)
      );
    });

    // Update the backend without blocking the UI
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ status: newStatus })
        .eq('id', draggableId)
        .eq('user_id', getUserId(userId));

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job status updated successfully",
      });
    } catch (error) {
      console.error('Error updating job status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update job status",
      });
      // Reload jobs if the update failed
      loadJobs();
    } finally {
      setIsUpdating(false);
    }
  };

  const jobsByStatus = JOB_STATUS_ORDER.reduce((acc, status) => {
    acc[status] = jobs.filter(job => job.status === status);
    return acc;
  }, {} as Record<JobStatus, Job[]>);

  // Check if there are any jobs in columns after the first one
  const hasJobsInLaterColumns = JOB_STATUS_ORDER.slice(1).some(
    status => jobsByStatus[status].length > 0
  );

  if (!isLoaded || initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading your jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar 
        onAddClick={() => setIsAddModalOpen(true)} 
        hasJobs={jobs.length > 0}
      />
      <main className="flex-1 p-8 pb-32">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Welcome back, {user?.firstName || 'there'}</h1>
            <p className="text-muted-foreground">
              Manage your job applications on the kanban board below
            </p>
          </div>
          
          <DragDropContext onDragEnd={onDragEnd}>
            <div 
              className={cn(
                "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 touch-manipulation",
                isUpdating && "opacity-75"
              )}
              style={{
                WebkitOverflowScrolling: 'touch', // Smooth scrolling on iOS
                overscrollBehavior: 'none' // Prevent pull-to-refresh
              }}
            >
            {JOB_STATUS_ORDER.map((status, index) => {
              const isSecondColumn = index === 1;
              const hasJobsInFirstColumn = jobsByStatus[JOB_STATUS_ORDER[0]].length > 0;
              
              return (
                <JobColumn 
                  key={status}
                  status={status}
                  jobs={jobsByStatus[status]}
                  onJobUpdate={handleJobUpdate}
                  onJobDelete={handleJobDelete}
                  onJobClick={(job) => {
                    setSelectedJob(job);
                    setIsDetailsModalOpen(true);
                  }}
                  isSecondColumn={isSecondColumn}
                  hasJobsInFirstColumn={hasJobsInFirstColumn && !hasJobsInLaterColumns}
                />
              );
            })}
            </div>
          </DragDropContext>
        </div>
      </main>

      <AddJobModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onJobAdded={loadJobs}
      />

      <JobDetailsModal
        open={isDetailsModalOpen}
        job={selectedJob}
        onOpenChange={(open) => {
          setIsDetailsModalOpen(open);
          if (!open) setSelectedJob(null);
        }}
        onUpdate={(job) => handleJobUpdate(job)}
        onDelete={() => handleJobDelete(selectedJob?.id || '')}
      />

      <AnalyticsBar jobs={jobs} />
    </div>
  );
}
