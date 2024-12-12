import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { DragDropContext, DropResult } from "@hello-pangea/dnd";
import { useState } from "react";
import { JobColumn } from "@/components/JobColumn";
import { Job, JobStatus, JOB_STATUS_ORDER } from "@/types/job";

const initialJobs = [
  {
    id: "1",
    company: "TechCorp Inc.",
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

  const onDragEnd = (result: DropResult) => {
    console.log("Drag ended:", result);
    const { source, destination } = result;
    
    if (!destination) {
      console.log("No destination, skipping update");
      return;
    }

    const sourceStatus = source.droppableId as JobStatus;
    const destStatus = destination.droppableId as JobStatus;
    
    console.log(`Moving from ${sourceStatus} to ${destStatus}`);

    setJobs(prevJobs => {
      // Create arrays for each status to maintain proper ordering
      const jobsByStatus: Record<JobStatus, Job[]> = {
        "Not Started": [],
        "In Progress": [],
        "Submitted": [],
        "Interview": []
      };

      // First, distribute all jobs except the moved one into their status arrays
      const sourceIndex = prevJobs.findIndex((_, index) => {
        const jobsInSourceStatus = prevJobs.filter(j => j.status === sourceStatus);
        return jobsInSourceStatus[source.index] === prevJobs[index];
      });

      const [movedJob] = prevJobs.splice(sourceIndex, 1);
      prevJobs.forEach(job => {
        jobsByStatus[job.status].push(job);
      });

      // Insert the moved job at the correct position in its new status array
      const updatedJob = { ...movedJob, status: destStatus };
      jobsByStatus[destStatus].splice(destination.index, 0, updatedJob);

      // Flatten the arrays back into a single array while maintaining order
      const newJobs = JOB_STATUS_ORDER.flatMap(status => jobsByStatus[status]);
      
      console.log("Updated jobs:", newJobs);
      return newJobs;
    });
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