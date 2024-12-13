import { JobCard } from "./JobCard";
import { Job, JobStatus } from "../types/job";
import { Droppable, Draggable } from "@hello-pangea/dnd";

export interface JobColumnProps {
  status: JobStatus;
  jobs: Job[];
}

export function JobColumn({ status, jobs }: JobColumnProps) {
  return (
    <div className="bg-muted p-4 rounded-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold">{status}</h2>
        <span className="text-sm text-muted-foreground">{jobs.length}</span>
      </div>
      <Droppable droppableId={status}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="space-y-4"
          >
            {jobs.map((job, index) => (
              <Draggable key={job.id} draggableId={job.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                    style={{
                      ...provided.draggableProps.style,
                      opacity: snapshot.isDragging ? 0.8 : 1,
                    }}
                  >
                    <JobCard job={job} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
            {jobs.length === 0 && (
              <div className="text-center text-sm text-muted-foreground py-4">
                No jobs in this column
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );
}
