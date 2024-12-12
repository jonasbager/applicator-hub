import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, User, MessageSquare, Link2 } from "lucide-react";
import { useEffect } from "react";
import type { JobCardProps } from "./JobCard";

interface JobDetailsModalProps extends JobCardProps {
  onClose: () => void;
}

export function JobDetailsModal({
  company,
  position,
  status,
  connections,
  matchRate,
  documents,
  onClose
}: JobDetailsModalProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Not Started":
        return "bg-gray-200 text-gray-800";
      case "In Progress":
        return "bg-blue-200 text-blue-800";
      case "Submitted":
        return "bg-green-200 text-green-800";
      case "Interview":
        return "bg-purple-200 text-purple-800";
      default:
        return "bg-gray-200";
    }
  };

  // Handle escape key press
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  // Add event listener for keyboard navigation
  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" 
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div 
        className="bg-background rounded-lg p-6 max-w-[425px] w-full m-4" 
        onClick={e => e.stopPropagation()}
      >
        <div className="mb-4">
          <h2 id="modal-title" className="text-xl font-semibold">{position}</h2>
          <p className="text-muted-foreground">{company}</p>
        </div>
        <div className="grid gap-6">
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(status)}>{status}</Badge>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{connections} connections</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Match Rate</span>
              <span className="font-medium">{matchRate}%</span>
            </div>
            <Progress value={matchRate} className="h-2" />
          </div>

          <div>
            <h4 className="text-sm font-medium mb-2">Required Documents</h4>
            <div className="flex flex-wrap gap-2">
              {documents.map((doc) => (
                <Badge 
                  key={doc} 
                  variant="secondary" 
                  className="flex items-center gap-1 bg-secondary/50 hover:bg-secondary/70 transition-colors"
                >
                  <FileText className="h-3 w-3" />
                  {doc}
                </Badge>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <button 
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              aria-label="Add Note"
            >
              <MessageSquare className="h-4 w-4" />
              Add Note
            </button>
            <button 
              className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
              aria-label="Add Document"
            >
              <Link2 className="h-4 w-4" />
              Add Document
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
