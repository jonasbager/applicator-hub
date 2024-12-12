import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { useState, useCallback } from "react";
import { JobColumn } from "@/components/JobColumn";
import { Job, JobStatus, JOB_STATUS_ORDER } from "@/types/job";

const initialJobs = [
  {
    id: "1",
    company: "TechCorp 2 Inc.",
    position: "Senior Frontend Developer",
    deadline: "2024-03-15",
    matchRate: 85,
    connections: 3,
    documents: ["CV", "Cover Letter"],
    status: "In Progress",
  },
  {
    id: "2",
    company: "Innovation Labs",
    position: "Full Stack Engineer",
    deadline: "2024-03-20",
    matchRate: 92,
    connections: 5,
    documents: ["CV", "Portfolio"],
    status: "Not Started",
  },
  {
    id: "3",
    company: "Digital Solutions",
    position: "React Developer",
    deadline: "2024-03-10",
    matchRate: 78,
    connections: 2,
    documents: ["CV", "Cover Letter", "References"],
    status: "Submitted",
  },
] as const;

const Index = () => {
  const [jobs, setJobs] = useState<Job[]>(() => 
    initialJobs.map(job => ({...job, documents: [...job.documents]}))
  );
  const [isLoading, setIsLoading] = useState(false);

  const onDragEnd = useCallback((result: DropResult) => {
    const { source, destination, draggableId } = result;
    
    if (!destination || (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    )) {
      return;
    }

    setIsLoading(true);

    try {
      setJobs(prevJobs => {
        const jobToMove = prevJobs.find(job => job.id === draggableId);
        if (!jobToMove) return prevJobs;

        const newJobs = prevJobs.filter(job => job.id !== draggableId);
        const updatedJob = { ...jobToMove, status: destination.droppableId as JobStatus };

        // Get jobs of the destination status
        const destinationJobs = newJobs.filter(
          job => job.status === destination.droppableId
        );

        // Insert the job at the new position
        destinationJobs.splice(destination.index, 0, updatedJob);

        // Reconstruct the jobs array maintaining status order
        const finalJobs = JOB_STATUS_ORDER.flatMap(status => 
          status === destination.droppableId
            ? destinationJobs
            : newJobs.filter(job => job.status === status)
        );

        // Here you would typically make an API call to update the job status
        // For now we'll just simulate a delay
        setTimeout(() => setIsLoading(false), 500);

        return finalJobs;
      });
    } catch (error) {
      console.error('Error updating job status:', error);
      // Here you would typically show an error toast
      setIsLoading(false);
    }
  }, []);

  const jobsByStatus = JOB_STATUS_ORDER.reduce((acc, status) => {
    acc[status] = jobs.filter(job => job.status === status);
    return acc;
  }, {} as Record<JobStatus, Job[]>);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold">Job Applications</h1>
                <p className="text-muted-foreground">
                  Track and manage your job applications
                </p>
              </div>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Add Application
              </Button>
            </div>
            
            <DragDropContext onDragEnd={onDragEnd}>
              <div 
                className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 transition-opacity ${
                  isLoading ? 'opacity-50' : ''
                }`}
              >
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
      </div>
    </SidebarProvider>
  );
};

export default Index;
