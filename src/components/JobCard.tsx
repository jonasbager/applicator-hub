import { Calendar, FileText, Percent, User, MessageSquare, Link2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface JobCardProps {
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
        return "bg-gray-200";
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
    <Card className="card-hover">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-xl font-semibold">{position}</CardTitle>
            <p className="text-sm text-muted-foreground">{company}</p>
          </div>
          <Badge className={getStatusColor(status)}>{status}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{deadline}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{connections} connections</span>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Match Rate</span>
              <span className="font-medium">{matchRate}%</span>
            </div>
            <Progress value={matchRate} className="h-2" />
          </div>

          <div className="flex gap-2">
            {documents.map((doc) => (
              <Badge key={doc} variant="secondary" className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {doc}
              </Badge>
            ))}
          </div>

          <div className="flex gap-2">
            <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              Add Note
            </button>
            <button className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1">
              <Link2 className="h-4 w-4" />
              Add Document
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}