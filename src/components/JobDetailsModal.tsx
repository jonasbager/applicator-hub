import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Badge } from "./ui/badge";
import { Job } from "../types/job";

export interface JobDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
}

export function JobDetailsModal({
  open,
  onOpenChange,
  job,
}: JobDetailsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>{job.position}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Company</h3>
            <p>{job.company}</p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Key Skills & Requirements</h3>
            <div className="flex flex-wrap gap-2">
              {job.keywords?.map((keyword, index) => (
                <Badge 
                  key={index}
                  className="text-sm py-1 px-3 bg-blue-100 hover:bg-blue-200 text-blue-700 border-0"
                >
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Description</h3>
            <p className="whitespace-pre-wrap text-sm text-muted-foreground">
              {job.description}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Status</h3>
            <Badge variant="outline" className="text-sm">
              {job.status}
            </Badge>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Job Posting URL</h3>
            <a
              href={job.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm break-all"
            >
              {job.url}
            </a>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
