import { useEffect, useState } from "react";
import { AppSidebar } from "../components/AppSidebar";
import { Job } from "../types/job";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { AddJobModal } from "../components/AddJobModal";
import { JobDetailsModal } from "../components/JobDetailsModal";
import { Button } from "../components/ui/button";
import { Loader2, RotateCcw, Trash2 } from "lucide-react";
import { useToast } from "../components/ui/use-toast";
import { useAuth } from "@clerk/clerk-react";
import { supabase } from "../lib/supabase";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

export function Archived() {
  const { userId } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (userId) {
      loadJobs();
    }
  }, [userId]);

  const loadJobs = async () => {
    if (!userId) return;
    try {
      const { data: fetchedJobs, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('user_id', userId)
        .eq('archived', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobs(fetchedJobs || []);
    } catch (error) {
      console.error("Error loading archived jobs:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to load archived jobs",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (jobId: string) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ archived: false })
        .eq('id', jobId)
        .eq('user_id', userId);

      if (error) throw error;

      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      toast({
        title: "Success",
        description: "Job restored successfully",
      });
    } catch (error) {
      console.error("Error restoring job:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to restore job",
      });
    }
  };

  const handleDelete = async (jobId: string) => {
    if (!userId) return;
    try {
      const { error } = await supabase
        .from('jobs')
        .delete()
        .eq('id', jobId)
        .eq('user_id', userId);

      if (error) throw error;

      setJobs(prevJobs => prevJobs.filter(job => job.id !== jobId));
      toast({
        title: "Success",
        description: "Job permanently deleted",
      });
    } catch (error) {
      console.error("Error deleting job:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete job",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
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
                  className="hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 cursor-pointer" onClick={() => setSelectedJob(job)}>
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
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {job.status}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRestore(job.id)}
                          disabled={!userId}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <RotateCcw className="h-4 w-4 mr-2" />
                          Restore
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              disabled={!userId}
                              className="text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the job application
                                for {job.position} at {job.company}.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(job.id)}
                                className="bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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
          onUpdate={() => loadJobs()}
          onDelete={() => loadJobs()}
        />
      )}
    </div>
  );
}
