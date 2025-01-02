import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Job, getDeadlineStatus, DateValue } from "../types/job";
import { JobDetailsModal } from "./JobDetailsModal";
import { CalendarClock } from "lucide-react";
import { Draggable } from "@hello-pangea/dnd";

export interface JobCardProps {
  job: Job;
  index: number;
  onUpdate?: (updatedJob: Job) => void;
  onDelete?: () => void;
}

function formatCardDate(date?: DateValue): string {
  if (!date) return 'Unknown';
  if (date === 'ASAP') return 'ASAP';
  return new Date(date).toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric'
  });
}

export function JobCard({ job, index, onUpdate, onDelete }: JobCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleJobUpdate = (updatedJob: Job) => {
    if (onUpdate) {
      onUpdate(updatedJob);
    }
  };

  const deadlineStatus = getDeadlineStatus(job.deadline);
  const deadlineColors = {
    red: "bg-red-100 text-red-800 border-red-200",
    yellow: "bg-yellow-100 text-yellow-800 border-yellow-200",
    green: "bg-green-100 text-green-800 border-green-200",
    asap: "bg-red-100 text-red-800 border-red-200",
    unknown: "bg-gray-100 text-gray-800 border-gray-200"
  };

  return (
    <Draggable draggableId={job.id} index={index}>
      {(provided) => (
        <>
          <Card
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => setIsDetailsOpen(true)}
          >
            <CardContent className="p-4">
              <div className="space-y-2">
                <div className="min-w-0">
                  <h3 className="font-semibold truncate">{job.position}</h3>
                  <p className="text-sm text-muted-foreground truncate">{job.company}</p>
                </div>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex gap-3 text-muted-foreground">
                    {job.notes?.length > 0 && (
                      <div>
                        {job.notes.length} note{job.notes.length !== 1 ? 's' : ''}
                      </div>
                    )}
                    {job.application_draft_url && (
                      <div className="text-blue-500">
                        Has application document
                      </div>
                    )}
                  </div>
                  {job.deadline && (
                    <div 
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md border text-xs whitespace-nowrap ${deadlineColors[deadlineStatus]}`}
                    >
                      <CalendarClock className="h-3.5 w-3.5" />
                      <span>Due {formatCardDate(job.deadline)}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <JobDetailsModal
            open={isDetailsOpen}
            onOpenChange={setIsDetailsOpen}
            job={job}
            onUpdate={handleJobUpdate}
            onDelete={onDelete}
          />
        </>
      )}
    </Draggable>
  );
}
