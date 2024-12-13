import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { JobDetailsModal } from "./JobDetailsModal";
import { Job } from "../types/job";

export interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const [showDetails, setShowDetails] = useState(false);

  return (
    <>
      <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setShowDetails(true)}>
        <CardHeader className="p-4">
          <CardTitle className="text-base font-semibold">{job.position}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="text-sm text-muted-foreground mb-3">
            <p>{job.company}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {job.keywords?.slice(0, 3).map((keyword, index) => (
              <Badge 
                key={index}
                className="text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 border-0"
              >
                {keyword}
              </Badge>
            ))}
            {job.keywords?.length > 3 && (
              <Badge 
                variant="outline"
                className="text-xs"
              >
                +{job.keywords.length - 3} more
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>

      <JobDetailsModal
        open={showDetails}
        onOpenChange={setShowDetails}
        job={job}
      />
    </>
  );
}
