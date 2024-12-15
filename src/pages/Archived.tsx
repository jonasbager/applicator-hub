import { useEffect, useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { Job } from "@/types/job";
import { getArchivedJobs } from "@/lib/job-scraping";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AddJobModal } from "@/components/AddJobModal";
import { JobDetailsModal } from "@/components/JobDetailsModal";

const Archived = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  useEffect(() => {
    loadJobs();
  }, []);

  const loadJobs = async () => {
    try {
      const fetchedJobs = await getArchivedJobs();
      setJobs(fetchedJobs);
    } catch (error) {
      console.error("Error loading archived jobs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleJobUpdate = (updatedJob: Job) => {
    setJobs(prevJobs => 
      prevJobs.map(job => 
        job.id === updatedJob.id ? updatedJob : job
      )
    );
  };

  const handleJobRemoved = (jobId: string) => {
    setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex w-full">
      <AppSidebar onAddClick={() => setIsAddModalOpen(true)} />
      <main className="flex-1 p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">Archived Applications</h1>
            <p className="text-muted-foreground">
              View and manage your archived job applications
            </p>
          </div>

          {jobs.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              No archived jobs found
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <Card 
                  key={job.id}
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedJob(job)}
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h3 className="font-semibold text-lg mb-1">{job.position}</h3>
                        <p className="text-muted-foreground mb-4">{job.company}</p>
                        <div className="flex flex-wrap gap-2">
                          {job.keywords?.slice(0, 5).map((keyword, index) => (
                            <Badge 
                              key={index}
                              variant="secondary"
                              className="text-xs"
                            >
                              {keyword}
                            </Badge>
                          ))}
                          {job.keywords && job.keywords.length > 5 && (
                            <Badge variant="outline" className="text-xs">
                              +{job.keywords.length - 5} more
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline">
                        {job.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <AddJobModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onJobAdded={loadJobs}
      />

      {selectedJob && (
        <JobDetailsModal
          open={true}
          onOpenChange={() => setSelectedJob(null)}
          job={selectedJob}
          onUpdate={handleJobUpdate}
          onDelete={() => handleJobRemoved(selectedJob.id)}
        />
      )}
    </div>
  );
};

export default Archived;
