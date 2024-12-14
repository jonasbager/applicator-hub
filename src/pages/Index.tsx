import { useEffect, useState } from "react";
import { JobColumn } from "../components/JobColumn";
import { AddJobModal } from "../components/AddJobModal";
import { getJobs, updateJobStatus } from "../lib/job-scraping";
import { Job, JobStatus, JOB_STATUS_ORDER } from "../types/job";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { AppSidebar } from "../components/AppSidebar";
import { AnalyticsBar } from "../components/AnalyticsBar";

export default function Index() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const fetchedJobs = await getJobs();
      setJobs(fetchedJobs);
    } catch (error) {
      console.error("Error loading jobs:", error);
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
    const { source, destination, draggableId } = result;
    
    if (!destination || (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )) {
      return;
    }

    const newStatus = destination.droppableId as JobStatus;
    
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
      await updateJobStatus(draggableId, newStatus);
    } catch (error) {
      console.error('Error updating job status:', error);
      // Reload jobs if the update failed
      loadJobs();
    }
  };

  const jobsByStatus = JOB_STATUS_ORDER.reduce((acc, status) => {
    acc[status] = jobs.filter(job => job.status === status);
    return acc;
  }, {} as Record<JobStatus, Job[]>);

  if (initialLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
