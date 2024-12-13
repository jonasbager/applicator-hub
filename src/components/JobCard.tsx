import { useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Badge } from "./ui/badge";
import { Job } from "../types/job";
import { JobDetailsModal } from "./JobDetailsModal";

export interface JobCardProps {
  job: Job;
  onUpdate?: (updatedJob: Job) => void;
  onDelete?: () => void;
}

export function JobCard({ job, onUpdate, onDelete }: JobCardProps) {
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleJobUpdate = (updatedJob: Job) => {
    if (onUpdate) {
      onUpdate(updatedJob);
    }
  };

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => setIsDetailsOpen(true)}
      >
        <CardContent className="p-4">
          <div className="space-y-2">
            <div>
              <h3 className="font-semibold">{job.position}</h3>
              <p className="text-sm text-muted-foreground">{job.company}</p>
            </div>
            <div className="flex flex-wrap gap-1">
              {job.keywords?.slice(0, 3).map((keyword, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs py-0 px-2"
                >
                  {keyword}
                </Badge>
              ))}
              {job.keywords?.length > 3 && (
                <Badge
                  variant="secondary"
                  className="text-xs py-0 px-2"
                >
                  +{job.keywords.length - 3}
                </Badge>
              )}
            </div>
            {job.notes?.length > 0 && (
              <div className="text-sm text-muted-foreground">
                {job.notes.length} note{job.notes.length !== 1 ? 's' : ''}
              </div>
            )}
            {job.application_draft_url && (
              <div className="text-sm text-blue-500">
                Has application document
              </div>
            )}
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
  );
}
