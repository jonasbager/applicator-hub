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
              "bg-muted/50 p-4 rounded-lg h-full min-h-[500px] relative",
              isSecondColumn && hasJobsInFirstColumn && jobs.length === 0 && [
                "bg-muted/30"
              ]
            )}
          >
            {isSecondColumn && hasJobsInFirstColumn && jobs.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="border-2 border-dashed border-primary/30 rounded-lg w-[90%] h-[140px] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    className="text-muted-foreground/50 mb-2"
                  >
                    <path 
                      d="M17 14C17 14 14.3333 19 12 19C9.66667 19 7 14 7 14" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                    />
                    <path 
                      d="M12 19V5" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round"
                    />
                    <path 
                      d="M9 8L12 5L15 8" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                  <div className="text-sm text-center px-4">
                    Drag your jobs here when you start
                    <br />
                    working on the application
                  </div>
                </div>
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
