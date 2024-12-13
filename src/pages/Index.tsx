import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { JobColumn } from "../components/JobColumn";
import { AddJobModal } from "../components/AddJobModal";
import { getJobs, updateJobStatus } from "../lib/job-scraping";
import { Job, JobStatus, JOB_STATUS_ORDER } from "../types/job";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { AppSidebar } from "../components/AppSidebar";

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

      const newJobs = prevJobs.filter(job => job.id !== draggableId);
      const updatedJob = { ...jobToMove, status: newStatus };

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
      <AppSidebar />
      <main className="flex-1 p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold">Job Applications</h1>
              <p className="text-muted-foreground">
                Track and manage your applications with Applymate
              </p>
            </div>
            <Button onClick={() => setIsAddModalOpen(true)}>
              Add Application
            </Button>
          </div>
          
          <DragDropContext onDragEnd={onDragEnd}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {JOB_STATUS_ORDER.map((status) => (
                <JobColumn 
                  key={status}
                  status={status}
                  jobs={jobsByStatus[status]}
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
    </div>
  );
}
