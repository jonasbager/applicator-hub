import { BarChart3, Briefcase, Building2, LineChart, Users } from "lucide-react";
import { Job } from "@/types/job";

interface AnalyticsBarProps {
  jobs: Job[];
}

export function AnalyticsBar({ jobs }: AnalyticsBarProps) {
  // Calculate statistics
  const totalJobs = jobs.length;
  const appliedJobs = jobs.filter(job => job.status !== 'Not Started').length;
  const interviewJobs = jobs.filter(job => job.status === 'Interview').length;

  // Calculate most common position
  const positionCounts = jobs.reduce((acc, job) => {
    acc[job.position] = (acc[job.position] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommonPosition = Object.entries(positionCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

  // Calculate most common company (as a proxy for industry)
  const companyCounts = jobs.reduce((acc, job) => {
    acc[job.company] = (acc[job.company] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const mostCommonCompany = Object.entries(companyCounts)
    .sort(([, a], [, b]) => b - a)[0]?.[0] || 'N/A';

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[calc(100%-32px)] max-w-6xl">
      <div className="bg-background/95 backdrop-blur-sm border rounded-xl shadow-lg p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Total Jobs */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Jobs</p>
              <p className="text-xl font-semibold">{totalJobs}</p>
            </div>
          </div>

          {/* Applied Jobs */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <LineChart className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Applied</p>
              <p className="text-xl font-semibold">{appliedJobs}</p>
            </div>
          </div>

          {/* Interviews */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Interviews</p>
              <p className="text-xl font-semibold">{interviewJobs}</p>
            </div>
          </div>

          {/* Most Common Position */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-orange-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Top Position</p>
              <p className="text-xl font-semibold truncate" title={mostCommonPosition}>
                {mostCommonPosition}
              </p>
            </div>
          </div>

          {/* Most Common Company */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Top Company</p>
              <p className="text-xl font-semibold truncate" title={mostCommonCompany}>
                {mostCommonCompany}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
