import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { DragDropContext } from "@hello-pangea/dnd";
import { useState } from "react";
import { JobColumn } from "@/components/JobColumn";
import { Job, JobStatus, JOB_STATUS_ORDER } from "@/types/job";

const initialJobs = [
  {
    company: "TechCorp Inc.",
    position: "Senior Frontend Developer",
    deadline: "2024-03-15",
    matchRate: 85,
    connections: 3,
    documents: ["CV", "Cover Letter"],
    status: "In Progress",
  },
  {
    company: "Innovation Labs",
    position: "Full Stack Engineer",
    deadline: "2024-03-20",
    matchRate: 92,
    connections: 5,
    documents: ["CV", "Portfolio"],
    status: "Not Started",
  },
  {
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

  const onDragEnd = (result: any) => {
    const { source, destination } = result;
    
    if (!destination) return;

    const newJobs = Array.from(jobs);
    const [removed] = newJobs.splice(source.index, 1);
    const updatedJob = { ...removed, status: destination.droppableId as JobStatus };
    
    // Find all jobs in the destination status
    const destinationJobs = newJobs.filter(job => job.status === destination.droppableId);
    
    // Find the index where we should insert the job
    let insertIndex = newJobs.findIndex(job => job.status === destination.droppableId);
    if (insertIndex === -1) {
      // If no jobs in destination status, find the first job with a higher status
      insertIndex = newJobs.findIndex(job => 
        JOB_STATUS_ORDER.indexOf(job.status) > 
        JOB_STATUS_ORDER.indexOf(destination.droppableId)
      );
      if (insertIndex === -1) insertIndex = newJobs.length;
    } else {
      insertIndex += Math.min(destination.index, destinationJobs.length);
    }
    
    newJobs.splice(insertIndex, 0, updatedJob);
    setJobs(newJobs);
  };

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
      </div>
    </SidebarProvider>
  );
};

export default Index;