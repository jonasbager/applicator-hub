import { BarChart, Briefcase, Building2, LineChart, Users } from "lucide-react";
import { Job } from "@/types/job";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AnalyticsBarProps {
  jobs: Job[];
}

export function AnalyticsBar({ jobs }: AnalyticsBarProps) {
  // Calculate statistics
  const totalJobs = jobs.length;
  const appliedJobs = jobs.filter(job => job.status === 'Submitted').length;
  const interviewJobs = jobs.filter(job => job.status === 'Interview').length;

  // Calculate most common position
  const positionCounts = jobs.reduce((acc, job) => {
    acc[job.position] = (acc[job.position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommonPosition = Object.entries(positionCounts)
    .sort(([, a], [, b]) => b - a)[0];

  // Calculate most common company (as a proxy for industry)
  const companyCounts = jobs.reduce((acc, job) => {
    acc[job.company] = (acc[job.company] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommonCompany = Object.entries(companyCounts)
    .sort(([, a], [, b]) => b - a)[0];

  return (
    <div className="fixed bottom-6 right-6 w-[calc(100%-288px-48px)]">
      <div className="bg-background/95 backdrop-blur-sm border rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Total Jobs */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Jobs</p>
                    <p className="text-lg font-semibold">{totalJobs}</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Total number of jobs added to your board</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Applied Jobs */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <LineChart className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Applied</p>
                    <p className="text-lg font-semibold">{appliedJobs}</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Jobs marked as "Submitted"</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Interviews */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Interviews</p>
                    <p className="text-lg font-semibold">{interviewJobs}</p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Jobs in "Interview" status</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Most Common Position */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                    <BarChart className="w-5 h-5 text-orange-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">Top Position</p>
                    <p className="text-sm font-medium truncate">
                      {mostCommonPosition ? mostCommonPosition[0] : 'N/A'}
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {mostCommonPosition ? (
                  <p>Applied to {mostCommonPosition[1]} times</p>
                ) : (
                  <p>No positions added yet</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {/* Most Common Company */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-purple-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-muted-foreground">Top Company</p>
                    <p className="text-sm font-medium truncate">
                      {mostCommonCompany ? mostCommonCompany[0] : 'N/A'}
                    </p>
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                {mostCommonCompany ? (
                  <p>Applied to {mostCommonCompany[1]} times</p>
                ) : (
                  <p>No companies added yet</p>
                )}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
}
