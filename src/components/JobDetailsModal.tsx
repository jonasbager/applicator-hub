import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Job, getDeadlineStatus, formatDate } from "../types/job";
import { useToast } from "./ui/use-toast";
import { Archive, CalendarClock, CalendarDays } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useSupabase } from "../lib/supabase";

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
  const { userId } = useAuth();
  const { supabase } = useSupabase();
  const [notes, setNotes] = useState(job.notes?.join('\n') || '');
  const [applicationUrl, setApplicationUrl] = useState(job.application_draft_url || '');
  const [deadline, setDeadline] = useState(job.deadline || '');
  const [startDate, setStartDate] = useState(job.start_date || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const { toast } = useToast();

  const deadlineStatus = getDeadlineStatus(deadline);
  const deadlineColors = {
    red: "bg-red-100 text-red-800",
    yellow: "bg-yellow-100 text-yellow-800",
    green: "bg-green-100 text-green-800",
    asap: "bg-red-100 text-red-800",
    unknown: "bg-gray-100 text-gray-800"
  };

  const handleSaveNotes = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      // Split notes by newlines and filter out empty lines
      const notesArray = notes.split('\n').filter(note => note.trim() !== '');
      
      const { data: updatedJob, error } = await supabase
        .from('jobs')
        .update({ notes: notesArray })
        .eq('id', job.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      if (onUpdate && updatedJob) {
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
        description: error instanceof Error ? error.message : "Failed to save notes",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveApplicationUrl = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const { data: updatedJob, error } = await supabase
        .from('jobs')
        .update({ application_draft_url: applicationUrl })
        .eq('id', job.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      if (onUpdate && updatedJob) {
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
        description: error instanceof Error ? error.message : "Failed to save application URL",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveDeadline = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const deadlineValue = deadline === 'unknown' ? null : deadline === 'custom' ? null : deadline;
      
      const { data: updatedJob, error } = await supabase
        .from('jobs')
        .update({ deadline: deadlineValue })
        .eq('id', job.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      if (onUpdate && updatedJob) {
        onUpdate(updatedJob);
      }

      toast({
        title: "Success",
        description: "Deadline saved successfully",
      });
    } catch (error) {
      console.error('Error saving deadline:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save deadline",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStartDate = async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      const startDateValue = startDate === 'unknown' ? null : startDate === 'custom' ? null : startDate;
      
      const { data: updatedJob, error } = await supabase
        .from('jobs')
        .update({ start_date: startDateValue })
        .eq('id', job.id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) throw error;
      if (onUpdate && updatedJob) {
        onUpdate(updatedJob);
      }

      toast({
        title: "Success",
        description: "Start date saved successfully",
      });
    } catch (error) {
      console.error('Error saving start date:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save start date",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleArchive = async () => {
    if (!userId) return;
    setIsArchiving(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ archived: true })
        .eq('id', job.id)
        .eq('user_id', userId);

      if (error) throw error;

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
        description: error instanceof Error ? error.message : "Failed to archive job",
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

            <div className="flex justify-between items-start gap-4">
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Status</h3>
                <Badge variant="outline" className="text-sm">
                  {job.status}
                </Badge>
              </div>

              <div className="flex-1">
                <h3 className="font-semibold mb-2">Start Date</h3>
                <div className="flex gap-2">
                  <Select
                    value={startDate === 'custom' ? 'custom' : (startDate || 'unknown')}
                    onValueChange={(value) => setStartDate(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">Unknown</SelectItem>
                      <SelectItem value="ASAP">ASAP</SelectItem>
                      <SelectItem value="custom">Custom Date</SelectItem>
                    </SelectContent>
                  </Select>
                  {startDate === "custom" && (
                    <Input
                      type="date"
                      onChange={(e) => setStartDate(e.target.value || 'custom')}
                    />
                  )}
                  <Button 
                    onClick={handleSaveStartDate}
                    disabled={isSaving || !userId}
                  >
                    Save
                  </Button>
                </div>
                {startDate && startDate !== 'custom' && (
                  <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm bg-gray-100 text-gray-800">
                    <CalendarDays className="h-4 w-4" />
                    <span>Starts {formatDate(startDate)}</span>
                  </div>
                )}
              </div>

              <div className="flex-1">
                <h3 className="font-semibold mb-2">Application Deadline</h3>
                <div className="flex gap-2">
                  <Select
                    value={deadline === 'custom' ? 'custom' : (deadline || 'unknown')}
                    onValueChange={(value) => setDeadline(value)}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="unknown">Unknown</SelectItem>
                      <SelectItem value="ASAP">ASAP</SelectItem>
                      <SelectItem value="custom">Custom Date</SelectItem>
                    </SelectContent>
                  </Select>
                  {deadline === "custom" && (
                    <Input
                      type="date"
                      onChange={(e) => setDeadline(e.target.value || 'custom')}
                    />
                  )}
                  <Button 
                    onClick={handleSaveDeadline}
                    disabled={isSaving || !userId}
                  >
                    Save
                  </Button>
                </div>
                {deadline && deadline !== 'custom' && (
                  <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm ${
                    deadlineColors[deadlineStatus]
                  }`}>
                    <CalendarClock className="h-4 w-4" />
                    <span>Due {formatDate(deadline)}</span>
                  </div>
                )}
              </div>
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
                  disabled={isSaving || !userId}
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
                  disabled={isSaving || !userId}
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
                disabled={isArchiving || !userId}
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
