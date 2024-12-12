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
          {jobs.length} {jobs.length === 1 ? 'job' : 'jobs'}
        </span>
      </div>
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-4 min-h-[200px] p-4 bg-muted/30 rounded-lg transition-colors ${
              snapshot.isDraggingOver ? "droppable-hover ring-2 ring-primary/20" : ""
            }`}
            aria-label={`${status} column`}
          >
            {jobs.map((job, index) => (
              <Draggable
                key={job.id}
                draggableId={job.id}
                index={index}
              >
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    className={`transition-transform ${
                      snapshot.isDragging ? "rotate-2 scale-105" : ""
                    }`}
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
