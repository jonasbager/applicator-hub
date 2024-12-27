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
                <div className="border-2 border-dashed border-primary/30 rounded-lg w-[90%] h-[90%] flex flex-col items-center justify-center gap-2 text-muted-foreground">
                  <svg 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    className="text-muted-foreground/50 mb-2"
                  >
                    <path 
                      d="M12 4C10.6193 4 9.5 5.11929 9.5 6.5C9.5 7.88071 10.6193 9 12 9C13.3807 9 14.5 7.88071 14.5 6.5C14.5 5.11929 13.3807 4 12 4ZM8.5 6.5C8.5 4.567 10.067 3 12 3C13.933 3 15.5 4.567 15.5 6.5C15.5 8.433 13.933 10 12 10C10.067 10 8.5 8.433 8.5 6.5Z" 
                      fill="currentColor"
                    />
                    <path 
                      d="M3.5 19.5C3.5 15.9101 6.41015 13 10 13H14C17.5899 13 20.5 15.9101 20.5 19.5V21H3.5V19.5ZM10 14C6.96243 14 4.5 16.4624 4.5 19.5V20H19.5V19.5C19.5 16.4624 17.0376 14 14 14H10Z" 
                      fill="currentColor"
                    />
                  </svg>
                  <div className="text-sm text-center px-4">
                    Drag your jobs here when you start
                    <br />
                    working on the application
                  </div>
                  <svg 
                    width="40" 
                    height="40" 
                    viewBox="0 0 40 40" 
                    fill="none" 
                    className="text-primary/40 mt-2"
                  >
                    <path 
                      d="M20 5C25.5228 5 30 9.47715 30 15C30 16.5366 29.6872 18.0033 29.1127 19.3372C28.9401 19.7471 29.0506 20.2196 29.3751 20.4977L35 25.5L29.3751 20.4977C29.0506 20.2196 28.9401 19.7471 29.1127 19.3372C29.6872 18.0033 30 16.5366 30 15C30 9.47715 25.5228 5 20 5Z" 
                      stroke="currentColor" 
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
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
