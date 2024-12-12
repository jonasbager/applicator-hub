import { Droppable, Draggable } from "@hello-pangea/dnd";
import { JobCard } from "./JobCard";
import type { Job } from "@/types/job";

interface JobColumnProps {
  status: Job["status"];
  jobs: Job[];
}

export function JobColumn({ status, jobs }: JobColumnProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">{status}</h2>
        <span className="text-sm text-muted-foreground">
          {jobs.length}
        </span>
      </div>
      <Droppable droppableId={status}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex flex-col gap-4 min-h-[200px] p-4 bg-muted/30 rounded-lg"
          >
            {jobs.map((job, index) => (
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
  );
}