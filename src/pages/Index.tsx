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
    console.log("Drag ended:", result);
    const { source, destination, draggableId } = result;

    // If there's no destination or the item was dropped in its original location
    if (!destination || 
        (source.droppableId === destination.droppableId && 
         source.index === destination.index)) {
      return;
    }

    // Find the job that was dragged
    const [company, position] = draggableId.split("-");
    const draggedJob = jobs.find(job => 
      job.company === company && job.position === position
    );

    if (!draggedJob) {
      console.error("Could not find dragged job");
      return;
    }

    // Create a new array without the dragged job
    const newJobs = jobs.filter(job => 
      !(job.company === company && job.position === position)
    );

    // Insert the job at the new position with updated status
    const updatedJob = {
      ...draggedJob,
      status: destination.droppableId as Job["status"]
    };

    // Get all jobs in the destination column
    const destinationJobs = jobs.filter(job => 
      job.status === destination.droppableId
    );

    // Insert the job at the correct position
    newJobs.splice(
      jobs.indexOf(destinationJobs[destination.index] || destinationJobs[destinationJobs.length - 1]) + 1 || 0,
      0,
      updatedJob
    );

    console.log("Updated jobs:", newJobs);
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