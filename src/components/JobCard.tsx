import { Calendar, FileText, Percent, User, MessageSquare, Link2, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export interface JobCardProps {
  company: string;
  position: string;
  deadline: string;
  matchRate: number;
  connections: number;
  documents: string[];
  status: "Not Started" | "In Progress" | "Submitted" | "Interview";
}

export function JobCard({
  company,
  position,
  deadline,
  matchRate,
  connections,
  documents,
  status,
}: JobCardProps) {
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

  return (
    <Dialog>
      <DialogTrigger className="w-full">
        <Card className="w-full transition-all duration-200 hover:shadow-lg hover:-translate-y-1 bg-white/50 backdrop-blur-sm border-2">
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
      </DialogTrigger>

      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">{position}</DialogTitle>
          <p className="text-muted-foreground">{company}</p>
        </DialogHeader>
        <div className="grid gap-6 py-4">
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
            <button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              <MessageSquare className="h-4 w-4" />
              Add Note
            </button>
            <button className="text-sm text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
              <Link2 className="h-4 w-4" />
              Add Document
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}