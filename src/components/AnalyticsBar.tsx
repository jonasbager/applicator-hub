import { BarChart, Briefcase, Building2, LineChart, Users, Clock, Calendar } from "lucide-react";
import { Job } from "../types/job";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Skeleton } from "./ui/skeleton";
import { cn } from "../lib/utils";

interface AnalyticsBarProps {
  jobs: Job[];
  loading?: boolean;
}

interface Metric {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  iconColorClass: string;
  tooltip: string;
  percentage?: number;
  subtitle?: string;
}

export function AnalyticsBar({ jobs, loading = false }: AnalyticsBarProps) {
  if (loading) {
    return (
      <div className="fixed bottom-6 right-6 w-[calc(100%-224px-48px)]">
        <div className="bg-background/95 backdrop-blur-sm border rounded-xl shadow-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate statistics
  const totalJobs = jobs.length;
  const appliedJobs = jobs.filter(job => job.status === 'Submitted').length;
  const interviewJobs = jobs.filter(job => job.status === 'Interview').length;
  const successRate = totalJobs ? Math.round((interviewJobs / totalJobs) * 100) : 0;

  // Calculate deadlines
  const upcomingDeadlines = jobs.filter(job => {
    if (!job.deadline || job.deadline === 'ASAP') return false;
    const deadline = new Date(job.deadline);
    const now = new Date();
    const daysUntil = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntil >= 0 && daysUntil <= 7;
  }).length;

  // Calculate rejected applications
  const rejectedJobs = jobs.filter(job => job.status === 'Rejected').length;

  const metrics: Metric[] = [
    {
      title: "Total Jobs",
      value: totalJobs,
      icon: Briefcase,
      colorClass: "bg-primary/10",
      iconColorClass: "text-primary",
      tooltip: "Total number of active jobs",
    },
    {
      title: "Applied",
      value: appliedJobs,
      percentage: totalJobs ? Math.round((appliedJobs / totalJobs) * 100) : 0,
      icon: LineChart,
      colorClass: "bg-blue-500/10",
      iconColorClass: "text-blue-500",
      tooltip: 'Jobs marked as "Submitted"',
    },
    {
      title: "Interviews",
      value: interviewJobs,
      percentage: successRate,
      icon: Users,
      colorClass: "bg-green-500/10",
      iconColorClass: "text-green-500",
      tooltip: `Jobs in "Interview" status (${successRate}% success rate)`,
    },
    {
      title: "Deadlines",
      value: upcomingDeadlines,
      icon: Clock,
      colorClass: "bg-yellow-500/10",
      iconColorClass: "text-yellow-500",
      tooltip: "Applications due in the next 7 days",
      subtitle: upcomingDeadlines === 1 ? "due soon" : "due soon",
    },
    {
      title: "Rejected",
      value: rejectedJobs,
      icon: Calendar,
      colorClass: "bg-red-500/10",
      iconColorClass: "text-red-500",
      tooltip: "Applications that were rejected",
      percentage: totalJobs ? Math.round((rejectedJobs / totalJobs) * 100) : 0,
    },
  ];

  return (
      <div className="fixed bottom-6 right-6 w-[calc(100%-224px-48px)]">
      <div className="bg-background/95 backdrop-blur-sm border rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {metrics.map((metric, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", metric.colorClass)}>
                      <metric.icon className={cn("w-5 h-5", metric.iconColorClass)} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{metric.title}</p>
                      <div className="flex items-baseline gap-2">
                        <p className="text-lg font-semibold">{metric.value}</p>
                        {metric.percentage !== undefined && (
                          <p className="text-xs text-muted-foreground">
                            {metric.percentage}%
                          </p>
                        )}
                        {metric.subtitle && (
                          <p className="text-xs text-muted-foreground">
                            {metric.subtitle}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{metric.tooltip}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </div>
    </div>
  );
}
