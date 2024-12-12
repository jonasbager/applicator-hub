import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { JobCard } from "@/components/JobCard";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { useState } from "react";

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

type Job = {
  company: string;
  position: string;
  deadline: string;
  matchRate: number;
  connections: number;
  documents: string[];
  status: "Not Started" | "In Progress" | "Submitted" | "Interview";
};

const statusOrder: Record<Job["status"], number> = {
  "Not Started": 0,
  "In Progress": 1,
  "Submitted": 2,
  "Interview": 3,
};

const Index = () => {
  const [jobs, setJobs] = useState<Job[]>(() => 
    initialJobs.map(job => ({...job, documents: [...job.documents]}))
  );

  const columns = {
    "Not Started": jobs.filter(job => job.status === "Not Started"),
    "In Progress": jobs.filter(job => job.status === "In Progress"),
    "Submitted": jobs.filter(job => job.status === "Submitted"),
    "Interview": jobs.filter(job => job.status === "Interview"),
  };

  const onDragEnd = (result: any) => {
    const { source, destination } = result;
    console.log("Drag ended:", { source, destination });

    // If dropped outside or in the same position
    if (!destination || 
        (source.droppableId === destination.droppableId && 
         source.index === destination.index)) {
      return;
    }

    // Create a new array of jobs
    const newJobs = [...jobs];
    
    // Find the job that was dragged
    const sourceColumnJobs = jobs.filter(job => job.status === source.droppableId);
    const draggedJob = sourceColumnJobs[source.index];
    
    if (!draggedJob) {
      console.error("Could not find dragged job");
      return;
    }

    console.log("Moving job:", { 
      from: source.droppableId, 
      to: destination.droppableId, 
      job: draggedJob 
    });

    // Remove the job from its current position
    const oldIndex = jobs.findIndex(job => 
      job.company === draggedJob.company && 
      job.position === draggedJob.position
    );
    newJobs.splice(oldIndex, 1);

    // Find the destination column jobs after removing the dragged item
    const destinationColumnJobs = newJobs.filter(
      job => job.status === destination.droppableId
    );

    // Calculate the new position
    let insertIndex;
    if (destinationColumnJobs.length === 0) {
      // If the column is empty, add at the end of all jobs with lower status
      insertIndex = newJobs.findIndex(job => 
        statusOrder[job.status] > statusOrder[destination.droppableId as Job["status"]]
      );
      if (insertIndex === -1) insertIndex = newJobs.length;
    } else {
      // Find the correct position within the destination column
      const destinationJob = destinationColumnJobs[Math.min(destination.index, destinationColumnJobs.length - 1)];
      insertIndex = newJobs.findIndex(job => job === destinationJob);
      if (insertIndex === -1) insertIndex = newJobs.length;
      if (destination.index >= destinationColumnJobs.length) insertIndex++;
    }

    // Insert the job at the new position with updated status
    const updatedJob = {
      ...draggedJob,
      status: destination.droppableId as Job["status"]
    };
    
    newJobs.splice(insertIndex, 0, updatedJob);
    
    console.log("Updated jobs array:", newJobs);
    setJobs(newJobs);
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-[1600px] mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold">Job Applications</h1>
                <p className="text-muted-foreground">Track and manage your job applications</p>
              </div>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Add Application
              </Button>
            </div>
            
            <DragDropContext onDragEnd={onDragEnd}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Object.entries(columns).map(([status, statusJobs]) => (
                  <div key={status} className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                      <h2 className="font-semibold text-lg">{status}</h2>
                      <span className="text-sm text-muted-foreground">
                        {statusJobs.length}
                      </span>
                    </div>
                    <Droppable droppableId={status}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.droppableProps}
                          className="flex flex-col gap-4 min-h-[200px] p-4 bg-muted/30 rounded-lg"
                        >
                          {statusJobs.map((job, index) => (
                            <Draggable
                              key={`${job.company}-${job.position}`}
                              draggableId={`${job.company}-${job.position}`}
                              index={index}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                >
                                  <JobCard {...job} />
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </div>
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