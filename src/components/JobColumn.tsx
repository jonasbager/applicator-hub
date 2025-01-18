import React from "react";
import { Droppable } from "@hello-pangea/dnd";
import { Job, JobStatus } from "../types/job";
import { JobCard } from "./JobCard";
import { cn } from "../lib/utils";

interface JobColumnProps {
  status: JobStatus;
  jobs: Job[];
  onJobUpdate: (job: Job) => void;
  onJobDelete: (jobId: string) => void;
  onJobClick?: (job: Job) => void;
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
  onJobClick,
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
              <div className="absolute top-4 inset-x-4 pointer-events-none">
                <div className="border-2 border-dashed border-primary/30 rounded-lg h-[140px] flex flex-col items-center justify-center gap-2 text-muted-foreground bg-muted/30">
                  <svg 
                    width="32" 
                    height="32" 
                    viewBox="0 0 1200 1200"
                    className="text-primary/40 mb-2"
                  >
                    <path 
                      d="M876.2,1004.4l129-129c7-7,7-18.4,0-25.5s-18.4-7-25.5,0l-90.8,90.8c3.9-356.2-177-539.9-333-631.8-174.6-102.8-350.9-114.9-358.3-115.4-9.9-.6-18.5,6.9-19.1,16.8,0,.4,0,.8,0,1.2,0,9.4,7.3,17.3,16.9,18,1.7,0,176.2,12.2,343.4,111.1,216,127.7,321.5,334.5,314,614.8l-114.7-114.6c-7-7-18.4-7-25.5,0-3.5,3.5-5.2,8.1-5.2,12.8s1.7,9.2,5.2,12.8l138.1,138.1c7,6.9,18.4,6.9,25.5,0h0Z"
                      fill="currentColor"
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
                  onArchive={onJobUpdate}
                  onClick={() => onJobClick?.(job)}
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
