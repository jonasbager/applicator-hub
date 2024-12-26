import { Droppable } from "@hello-pangea/dnd";
import { Job, JobStatus } from "../types/job";
import { JobCard } from "./JobCard";
import { cn } from "../lib/utils";

interface JobColumnProps {
  status: JobStatus;
  jobs: Job[];
  onJobUpdate: (job: Job) => void;
  onJobDelete: (jobId: string) => void;
  isSecondColumn?: boolean;
  hasJobsInFirstColumn?: boolean;
}

const statusTitles: Record<JobStatus, string> = {
  "Not Started": "Not Started",
  "In Progress": "In Progress",
  "Submitted": "Submitted",
  "Interview": "Interview"
};

export function JobColumn({ 
  status, 
  jobs, 
  onJobUpdate, 
  onJobDelete,
  isSecondColumn,
  hasJobsInFirstColumn
}: JobColumnProps) {
  return (
    <div>
      <div className="mb-3">
        <h3 className="font-medium text-sm text-muted-foreground">
          {statusTitles[status]} ({jobs.length})
        </h3>
      </div>

      <Droppable droppableId={status}>
        {(provided) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={cn(
              "bg-muted/50 p-4 rounded-lg h-full min-h-[500px] relative transition-all duration-300",
              isSecondColumn && hasJobsInFirstColumn && jobs.length === 0 && [
                "border-2 border-dashed border-primary/30",
                "hover:border-primary/50",
                "group"
              ]
            )}
          >
            {isSecondColumn && hasJobsInFirstColumn && jobs.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-sm text-muted-foreground text-center px-4">
                  Drag jobs here after you've submitted your application
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              {jobs.map((job, index) => (
                <JobCard
                  key={job.id}
                  job={job}
                  index={index}
                  onUpdate={onJobUpdate}
                  onDelete={() => onJobDelete(job.id)}
                />
              ))}
            </div>
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
}
