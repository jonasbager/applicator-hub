import React, { useEffect, useState } from "react";
import { PdfViewer } from "./ui/pdf-viewer";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { Input } from "./ui/input";
import { Checkbox } from "./ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Job, getDeadlineStatus, formatDate } from "../types/job";
import { useToast } from "./ui/use-toast";
import { Archive, CalendarClock, CalendarDays, History, Loader2 } from "lucide-react";
import { useAuth } from "@clerk/clerk-react";
import { useSupabase } from "../lib/supabase";
import { getUserId } from "../lib/user-id";
import { calculateMatchPercentage } from "../lib/job-matching-utils";

interface JobSnapshot {
  id: string;
  job_id: string;
  user_id: string;
  position: string;
  company: string;
  description: string;
  keywords: string[];
  url: string;
  html_content: string;
  created_at: string;
  pdf_url: string;
}

export interface JobDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
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
  const [notes, setNotes] = useState('');
  const [inJoblog, setInJoblog] = useState(false);
  const [applicationUrl, setApplicationUrl] = useState('');
  const [deadline, setDeadline] = useState<string>("");
  const [deadlineType, setDeadlineType] = useState<string>("unknown");
  const [startDate, setStartDate] = useState<string>("");
  const [startDateType, setStartDateType] = useState<string>("unknown");
  const [isSaving, setIsSaving] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [editablePosition, setEditablePosition] = useState('');
  const [editableCompany, setEditableCompany] = useState('');
  const [isLoadingSnapshot, setIsLoadingSnapshot] = useState(false);
  const [latestSnapshot, setLatestSnapshot] = useState<JobSnapshot | null>(null);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  // Load latest snapshot on open
  useEffect(() => {
    async function loadLatestSnapshot() {
      if (!open || !job || !userId) return;

      try {
        // First check if any snapshots exist
        // First check if any snapshots exist for this specific job
        const { data, error } = await supabase
          .from('job_snapshots')
          .select('*')
          .match({
            job_id: job.id,
            user_id: getUserId(userId)
          })
          .order('created_at', { ascending: false })
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          console.log('Found snapshot:', data);
          setLatestSnapshot(data);
        }
      } catch (error) {
        console.error('Error loading snapshot:', error);
      }
    }

    loadLatestSnapshot();
  }, [open, job, userId, supabase]);
  const { toast } = useToast();

  // Reset form when job changes or modal opens
  useEffect(() => {
    if (open && job) {
      setNotes(job.notes?.join('\n') || '');
      setApplicationUrl(job.application_draft_url || '');
      setInJoblog(job.in_joblog || false);
      setEditablePosition(job.position);
      setEditableCompany(job.company);
      
      // Handle deadline
      if (job.deadline === 'ASAP') {
        setDeadlineType('ASAP');
        setDeadline('');
      } else if (job.deadline) {
        setDeadlineType('custom');
        setDeadline(job.deadline);
      } else {
        setDeadlineType('unknown');
        setDeadline('');
      }

      // Handle start date
      if (job.start_date === 'ASAP') {
        setStartDateType('ASAP');
        setStartDate('');
      } else if (job.start_date) {
        setStartDateType('custom');
        setStartDate(job.start_date);
      } else {
        setStartDateType('unknown');
        setStartDate('');
      }
    }
  }, [job, open]);

  const deadlineStatus = getDeadlineStatus(deadline);
  const deadlineColors = {
    red: "bg-red-100 text-red-800",
    yellow: "bg-yellow-100 text-yellow-800",
    green: "bg-green-100 text-green-800",
    asap: "bg-red-100 text-red-800",
    unknown: "bg-gray-100 text-gray-800"
  };

  const handleViewSnapshot = async () => {
    if (!userId || !job) return;
    setIsLoadingSnapshot(true);
    try {
      if (!latestSnapshot) {
        // Create new snapshot
        console.log('Creating new snapshot for job:', job.id);
        const response = await fetch("/.netlify/functions/generate-job-pdf", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            url: job.url
          })
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('PDF generation failed:', errorData);
          throw new Error(`Failed to generate PDF: ${response.status} ${response.statusText}`);
        }

        const blob = await response.blob();
        const storageName = "pdf_snapshots";
        const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
        const fileName = `${getUserId(userId)}/${job.id}-${dateStr}.pdf`;

        const { error: uploadError } = await supabase.storage
          .from(storageName)
          .upload(fileName, blob, { 
            contentType: "application/pdf",
            upsert: true
          });

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Failed to upload PDF to storage: ${uploadError.message}`);
        }

        // Create snapshot record
        const { data: newSnapshot, error: snapshotError } = await supabase
          .from("job_snapshots")
          .insert({
            job_id: job.id,
            user_id: getUserId(userId),
            position: job.position,
            company: job.company,
            description: job.description,
            keywords: job.keywords,
            url: job.url,
            html_content: "", // We don't have this for existing jobs
            created_at: new Date().toISOString(),
            pdf_url: fileName
          })
          .select()
          .single();

        if (snapshotError) {
          console.error("Error creating snapshot:", snapshotError);
          throw snapshotError;
        }

        setLatestSnapshot(newSnapshot);

        // Get signed URL for the new snapshot
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('pdf_snapshots')
          .createSignedUrl(fileName, 60 * 60);

        if (signedUrlError) throw signedUrlError;
        if (!signedUrlData?.signedUrl) throw new Error('Failed to get signed URL');

        setPdfUrl(signedUrlData.signedUrl);
        setShowPdfViewer(true);

        toast({
          title: "Time Machine Backup Created",
          description: "Opening snapshot viewer...",
          duration: 2000
        });
      } else {
        // Get signed URL for existing snapshot
        const { data: signedUrlData, error: signedUrlError } = await supabase.storage
          .from('pdf_snapshots')
          .createSignedUrl(latestSnapshot.pdf_url, 60 * 60);

        if (signedUrlError) throw signedUrlError;
        if (!signedUrlData?.signedUrl) throw new Error('Failed to get signed URL');

        setPdfUrl(signedUrlData.signedUrl);
        setShowPdfViewer(true);

        toast({
          title: "Opening Time Machine",
          description: "Loading snapshot viewer...",
          duration: 2000
        });
      }
    } catch (error) {
      console.error('Error with snapshot:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to handle snapshot",
      });
    } finally {
      setIsLoadingSnapshot(false);
    }
  };

  const handleUpdateDetails = async (field: 'position' | 'company', value: string) => {
    if (!userId || !job) return;
    setIsSaving(true);
    try {
      // Get user preferences to calculate match percentage
      const { data: preferences } = await supabase
        .from('job_preferences')
        .select('*')
        .eq('user_id', getUserId(userId))
        .single();

      // Calculate new match percentage if preferences exist
      let matchPercentage = job.match_percentage;
      if (preferences) {
        matchPercentage = calculateMatchPercentage(
          job.keywords,
          field === 'position' ? value : job.position,
          preferences
        );
      }

      const { data: updatedJob, error } = await supabase
        .from('jobs')
        .update({ 
          [field]: value,
          match_percentage: matchPercentage 
        })
        .eq('id', job.id)
        .eq('user_id', getUserId(userId))
        .select('*')
        .single();

      if (error) throw error;
      if (onUpdate && updatedJob) {
        onUpdate(updatedJob);
      }

      toast({
        title: "Success",
        description: `${field === 'position' ? 'Position' : 'Company'} updated successfully`,
      });
    } catch (error) {
      console.error(`Error updating ${field}:`, error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : `Failed to update ${field}`,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveNotes = async () => {
    if (!userId || !job) return;
    setIsSaving(true);
    try {
      // Split notes by newlines and filter out empty lines
      const notesArray = notes.split('\n').filter(note => note.trim() !== '');
      
      const { data: updatedJob, error } = await supabase
        .from('jobs')
        .update({ notes: notesArray })
        .eq('id', job.id)
        .eq('user_id', getUserId(userId))
        .select('*')
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
    if (!userId || !job) return;
    setIsSaving(true);
    try {
      const { data: updatedJob, error } = await supabase
        .from('jobs')
        .update({ application_draft_url: applicationUrl })
        .eq('id', job.id)
        .eq('user_id', getUserId(userId))
        .select('*')
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
    if (!userId || !job) return;
    setIsSaving(true);
    try {
      const deadlineValue = deadlineType === 'ASAP' ? 'ASAP' : 
                           deadlineType === 'custom' ? deadline : null;
      
      const { data: updatedJob, error } = await supabase
        .from('jobs')
        .update({ deadline: deadlineValue })
        .eq('id', job.id)
        .eq('user_id', getUserId(userId))
        .select('*')
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
    if (!userId || !job) return;
    setIsSaving(true);
    try {
      const startDateValue = startDateType === 'ASAP' ? 'ASAP' : 
                           startDateType === 'custom' ? startDate : null;
      
      const { data: updatedJob, error } = await supabase
        .from('jobs')
        .update({ start_date: startDateValue })
        .eq('id', job.id)
        .eq('user_id', getUserId(userId))
        .select('*')
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
    if (!userId || !job) return;
    setIsArchiving(true);
    try {
      const { error } = await supabase
        .from('jobs')
        .update({ archived: true })
        .eq('id', job.id)
        .eq('user_id', getUserId(userId));

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

  if (!job) return null;

  return (
    <>
      {showPdfViewer && pdfUrl && latestSnapshot && (
        <PdfViewer
          url={pdfUrl}
          title={`${job.position} at ${job.company}`}
          open={showPdfViewer}
          onOpenChange={setShowPdfViewer}
        />
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between gap-4">
              <div className="flex-1">
                <Input
                  value={editablePosition}
                  onChange={(e) => setEditablePosition(e.target.value)}
                  className="font-semibold text-lg"
                  onBlur={() => {
                    if (editablePosition !== job.position) {
                      handleUpdateDetails('position', editablePosition);
                    }
                  }}
                />
              </div>
              <Badge variant="outline" className="text-sm">
                {job.status}
              </Badge>
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold mb-2">Company</h3>
                <div className="flex gap-2">
                  <Input
                    value={editableCompany}
                    onChange={(e) => setEditableCompany(e.target.value)}
                    onBlur={() => {
                      if (editableCompany !== job.company) {
                        handleUpdateDetails('company', editableCompany);
                      }
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="joblog"
                  checked={inJoblog}
                  onCheckedChange={async (checked) => {
                    if (!userId) return;
                    setIsSaving(true);
                    try {
                      const { data: updatedJob, error } = await supabase
                        .from('jobs')
                        .update({ in_joblog: checked })
                        .eq('id', job.id)
                        .eq('user_id', getUserId(userId))
                        .select('*')
                        .single();

                      if (error) throw error;
                      if (onUpdate && updatedJob) {
                        onUpdate(updatedJob);
                      }
                      setInJoblog(!!checked);

                      toast({
                        title: "Success",
                        description: checked ? "Added to Joblog" : "Removed from Joblog",
                      });
                    } catch (error) {
                      console.error('Error updating joblog status:', error);
                      toast({
                        variant: "destructive",
                        title: "Error",
                        description: error instanceof Error ? error.message : "Failed to update joblog status",
                      });
                    } finally {
                      setIsSaving(false);
                    }
                  }}
                />
                <label
                  htmlFor="joblog"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Added to Joblog
                </label>
              </div>
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

            <div className="grid grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Start Date</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 min-w-0">
                    <Select value={startDateType} onValueChange={setStartDateType}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">Unknown</SelectItem>
                        <SelectItem value="ASAP">ASAP</SelectItem>
                        <SelectItem value="custom">Custom Date</SelectItem>
                      </SelectContent>
                    </Select>
                    {startDateType === "custom" && (
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="flex-1 min-w-0 w-[140px]"
                      />
                    )}
                    <Button 
                      onClick={handleSaveStartDate}
                      disabled={isSaving || !userId}
                      size="sm"
                    >
                      Save
                    </Button>
                  </div>
                  {startDateType !== 'unknown' && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm bg-gray-100 text-gray-800">
                      <CalendarDays className="h-4 w-4" />
                      <span>Starts {startDateType === 'ASAP' ? 'ASAP' : formatDate(startDate)}</span>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Application Deadline</h3>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 min-w-0">
                    <Select value={deadlineType} onValueChange={setDeadlineType}>
                      <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="unknown">Unknown</SelectItem>
                        <SelectItem value="ASAP">ASAP</SelectItem>
                        <SelectItem value="custom">Custom Date</SelectItem>
                      </SelectContent>
                    </Select>
                    {deadlineType === "custom" && (
                      <Input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        className="flex-1 min-w-0 w-[140px]"
                      />
                    )}
                    <Button 
                      onClick={handleSaveDeadline}
                      disabled={isSaving || !userId}
                      size="sm"
                    >
                      Save
                    </Button>
                  </div>
                  {deadlineType !== 'unknown' && (
                    <div className={`mt-2 inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-sm ${
                      deadlineColors[deadlineStatus]
                    }`}>
                      <CalendarClock className="h-4 w-4" />
                      <span>Due {deadlineType === 'ASAP' ? 'ASAP' : formatDate(deadline)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">Job Posting URL</h3>
                  {isLoadingSnapshot && (
                    <span className="text-xs text-muted-foreground">
                      {latestSnapshot ? "Loading snapshot..." : "Creating snapshot..."}
                    </span>
                  )}
                  {latestSnapshot && !isLoadingSnapshot && (
                    <span className="text-xs text-muted-foreground">
                      Snapshot from {new Date(latestSnapshot.created_at).toLocaleString()}
                    </span>
                  )}
                </div>
                {job.url && (
                  <Button
                    onClick={handleViewSnapshot}
                    disabled={isLoadingSnapshot || !userId}
                    className={`${
                      latestSnapshot 
                        ? "bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600" 
                        : "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                    } text-white`}
                    size="sm"
                  >
                    {isLoadingSnapshot ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <History className="h-4 w-4 mr-2" />
                    )}
                    {latestSnapshot ? "View Snapshot" : "Create Snapshot"}
                  </Button>
                )}
              </div>
              {job.url && (
                <>
                  <a
                    href={job.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline text-sm break-all"
                  >
                    {job.url}
                  </a>
                  <p className="text-sm text-muted-foreground mt-2">
                    <History className="h-4 w-4 inline-block mr-1" />
                    Time Machine lets you view a snapshot of the job posting, even if it gets taken down.
                  </p>
                </>
              )}
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
