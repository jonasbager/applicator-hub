import { useEffect, useState } from "react";
import { JobColumn } from "../components/JobColumn";
import { AddJobModal } from "../components/AddJobModal";
import { Job, JobStatus, JOB_STATUS_ORDER } from "../types/job";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { AppSidebar } from "../components/AppSidebar";
import { AnalyticsBar } from "../components/AnalyticsBar";
import { useAuthBridge } from "../hooks/use-auth-bridge";
import { Loader2 } from "lucide-react";
import { useToast } from "../components/ui/use-toast";

export function Index() {
  const { bridge, isLoaded } = useAuthBridge();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (isLoaded && bridge) {
      loadJobs();
    }
  }, [isLoaded, bridge]);

  const loadJobs = async () => {
    if (!bridge) return;
    
    try {
      const fetchedJobs = await bridge.getJobs();
      setJobs(fetchedJobs);
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

  const handleJobUpdate = (updatedJob: Job) => {
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job.id === updatedJob.id ? updatedJob : job
      )
    );
  };

  const handleJobDelete = (jobId: string) => {
    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
  };

  const onDragEnd = async (result: DropResult) => {
    if (!bridge) return;
    
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
      await bridge.updateJob(draggableId, { status: newStatus });
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
      <AppSidebar onAddClick={() => setIsAddModalOpen(true)} />
      <main className="flex-1 p-8 pb-32">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Job Applications</h1>
            <p className="text-muted-foreground">
              Track and manage your applications with Applymate
            </p>
          </div>
          
          <DragDropContext onDragEnd={onDragEnd}>
            <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 ${
              isUpdating ? 'opacity-75' : ''
            }`}>
              {JOB_STATUS_ORDER.map((status) => (
                <JobColumn 
                  key={status}
                  status={status}
                  jobs={jobsByStatus[status]}
                  onJobUpdate={handleJobUpdate}
                  onJobDelete={handleJobDelete}
                />
              ))}
            </div>
          </DragDropContext>
        </div>
      </main>

      <AddJobModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onJobAdded={loadJobs}
      />

      <AnalyticsBar jobs={jobs} />
    </div>
  );
}
