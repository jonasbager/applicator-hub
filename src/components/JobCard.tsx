import { Calendar, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { forwardRef, useState } from "react";
import { JobDetailsModal } from "./JobDetailsModal";

export interface JobCardProps {
  company: string;
  position: string;
  deadline: string;
  matchRate: number;
  connections: number;
  documents: string[];
  status: "Not Started" | "In Progress" | "Submitted" | "Interview";
}

export const JobCard = forwardRef<HTMLDivElement, JobCardProps>((props, ref) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { company, position, deadline, matchRate, status } = props;

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

  const handleCardClick = (e: React.MouseEvent) => {
    // Only open modal if not dragging
    if (!(e.target as HTMLElement).closest('[data-rbd-draggable-context-id]')) {
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <div ref={ref}>
        <Card 
          onClick={handleCardClick}
          className="w-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 bg-white/50 backdrop-blur-sm border-2 cursor-grab active:cursor-grabbing"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsModalOpen(true);
            }
          }}
        >
          <CardHeader className="pb-2 space-y-2">
            <div className="flex flex-col gap-2">
              <Badge className={`${getStatusColor(status)} self-start`}>{status}</Badge>
              <div className="space-y-1 text-left">
                <CardTitle className="text-base sm:text-lg font-semibold line-clamp-2">{position}</CardTitle>
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  {company}
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>{deadline}</span>
              </div>
              <span className="font-medium text-foreground">{matchRate}% Match</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {isModalOpen && (
        <JobDetailsModal 
          {...props}
          onClose={() => setIsModalOpen(false)}
        />
      )}
    </>
  );
});
