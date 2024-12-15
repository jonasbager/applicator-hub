import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Job } from "../types/job";
import { updateJobNotes, updateJobApplicationUrl, archiveJob } from "../lib/job-scraping";
import { useToast } from "./ui/use-toast";
import { Archive } from "lucide-react";

export interface JobDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job;
  onUpdate?: (updatedJob: Job) => void;
  onDelete?: () => void;
}

export function JobDetailsModal({
  open,
  onOpenChange,
  job,
  onUpdate,
  onDelete,
}: JobDetailsModalProps) {
  const [notes, setNotes] = useState(job.notes?.join('\n') || '');
  const [applicationUrl, setApplicationUrl] = useState(job.application_draft_url || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const { toast } = useToast();

  const handleSaveNotes = async () => {
    setIsSaving(true);
    try {
      // Split notes by newlines and filter out empty lines
      const notesArray = notes.split('\n').filter(note => note.trim() !== '');
      const updatedJob = await updateJobNotes(job.id, notesArray);
      if (onUpdate) {
        onUpdate(updatedJob);
      }
      toast({
        title: "Success",
        description: "Notes saved successfully",
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save notes",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveApplicationUrl = async () => {
    setIsSaving(true);
    try {
      const updatedJob = await updateJobApplicationUrl(job.id, applicationUrl);
      if (onUpdate) {
        onUpdate(updatedJob);
      }
      toast({
        title: "Success",
        description: "Application URL saved successfully",
      });
    } catch (error) {
      console.error('Error saving application URL:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save application URL",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    try {
      await archiveJob(job.id);
      toast({
        title: "Success",
        description: "Job archived successfully",
      });
      onOpenChange(false);
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error archiving job:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to archive job",
      });
    } finally {
      setIsArchiving(false);
      setShowArchiveConfirm(false);
    }
  };

  return (
    <>
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

            <div>
              <h3 className="font-semibold mb-2">Application Document</h3>
              <div className="flex gap-2">
                <Input
                  placeholder="Paste your Google Docs URL here"
                  value={applicationUrl}
                  onChange={(e) => setApplicationUrl(e.target.value)}
                />
                <Button 
                  onClick={handleSaveApplicationUrl}
                  disabled={isSaving}
                >
                  Save
                </Button>
              </div>
              {applicationUrl && (
                <a
                  href={applicationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 hover:underline text-sm mt-2 inline-block"
                >
                  Open Application Document
                </a>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <div className="flex flex-col gap-2">
                <Textarea
                  placeholder="Add your notes here... (one note per line)"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                />
                <Button 
                  onClick={handleSaveNotes}
                  disabled={isSaving}
                  className="self-end"
                >
                  Save Notes
                </Button>
              </div>
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowArchiveConfirm(true)}
                disabled={isArchiving}
                className="text-muted-foreground hover:text-primary"
              >
                <Archive className="h-4 w-4 mr-2" />
                Archive Job
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={showArchiveConfirm} onOpenChange={setShowArchiveConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Archive this job?</AlertDialogTitle>
            <AlertDialogDescription>
              This will move the job to your archives. You can restore it later if needed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleArchive}>
              Archive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
