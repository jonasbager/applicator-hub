import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { scrapeJobDetails, JobDetails } from "../lib/job-scraping";
import { Loader2, Sparkles } from "lucide-react";
import { Badge } from "./ui/badge";
import { useAuth } from "@clerk/clerk-react";
import { JobStatus } from "../types/job";
import { JobPreferences } from "../types/resume";
import { calculateMatchPercentage } from "../lib/job-matching-utils";
import { useSupabase } from "../lib/supabase";
import { getUserId } from "../lib/user-id";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface AddJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobAdded: () => void;
}

export function AddJobModal({ open, onOpenChange, onJobAdded }: AddJobModalProps) {
  const { userId } = useAuth();
  const { supabase } = useSupabase();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [preferences, setPreferences] = useState<JobPreferences | null>(null);
  const { toast } = useToast();
  const [jobDetails, setJobDetails] = useState<JobDetails>({
    position: "",
    company: "",
    description: "",
    keywords: [],
    url: "",
    rawHtml: ""
  });
  const [deadline, setDeadline] = useState("");
  const [deadlineType, setDeadlineType] = useState("unknown");
  const [startDate, setStartDate] = useState("");
  const [startDateType, setStartDateType] = useState("unknown");

  // Reset form when modal closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  // Load user preferences
  useEffect(() => {
    async function loadPreferences() {
      if (!userId) return;
      try {
        const { data, error } = await supabase
          .from("job_preferences")
          .select("*")
          .eq("user_id", userId)
          .single();

        if (error) throw error;
        setPreferences(data);
      } catch (err) {
        console.error("Error loading preferences:", err);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load preferences"
        });
      }
    }
    loadPreferences();
  }, [userId, supabase, toast]);

  const resetForm = () => {
    setUrl("");
    setJobDetails({
      position: "",
      company: "",
      description: "",
      keywords: [],
      url: "",
      rawHtml: ""
    });
    setDeadline("");
    setDeadlineType("unknown");
    setStartDate("");
    setStartDateType("unknown");
  };

  function getLinkedInJobUrl(possibleUrl: string): string {
    try {
      const jobId = possibleUrl.match(/(?:currentJobId=|jobs\/view\/)(\d+)/)?.[1];
      if (!jobId) {
        return possibleUrl;
      }
      return `https://www.linkedin.com/jobs/view/${jobId}`;
    } catch (err) {
      console.error("Error parsing LinkedIn URL:", err);
      return possibleUrl;
    }
  }

  function handleUrlChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newUrl = e.target.value;
    if (newUrl.includes("linkedin.com/jobs")) {
      const directUrl = getLinkedInJobUrl(newUrl);
      setUrl(directUrl);
      setJobDetails((prev) => ({ ...prev, url: directUrl }));
    } else {
      setUrl(newUrl);
      setJobDetails((prev) => ({ ...prev, url: newUrl }));
    }
  }

  // Keep URL fields in sync
  useEffect(() => {
    if (jobDetails.url !== url) {
      setUrl(jobDetails.url);
    }
  }, [jobDetails.url, url]);

  async function fetchDetails() {
    if (!url) {
      toast({
        variant: "destructive",
        title: "URL required",
        description: "Please enter a job posting URL"
      });
      return;
    }
    setLoading(true);
    try {
      const details = await scrapeJobDetails(url);
      setJobDetails((prev) => ({
        ...prev,
        ...details,
        url,
        rawHtml: details.rawHtml || ""
      }));
      toast({
        title: "Success",
        description: "Job details extracted successfully"
      });
    } catch (err) {
      console.error("Error fetching job details:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to fetch job details"
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);

    try {
      const finalDeadline =
        deadlineType === "ASAP" ? "ASAP" : deadlineType === "custom" ? deadline : null;
      const finalStartDate =
        startDateType === "ASAP" ? "ASAP" : startDateType === "custom" ? startDate : null;

      let matchPercentage: number | undefined;
      if (preferences) {
        matchPercentage = calculateMatchPercentage(
          jobDetails.keywords,
          jobDetails.position,
          preferences
        );
      }

      const { data: newJob, error: jobError } = await supabase
        .from("jobs")
        .insert({
          user_id: getUserId(userId),
          position: jobDetails.position,
          company: jobDetails.company,
          description: jobDetails.description,
          keywords: jobDetails.keywords,
          url: jobDetails.url,
          status: "Not Started" as JobStatus,
          notes: [],
          application_draft_url: "",
          archived: false,
          created_at: new Date().toISOString(),
          deadline: finalDeadline,
          start_date: finalStartDate,
          match_percentage: matchPercentage
        })
        .select("id")
        .single();

      if (jobError) throw jobError;
      const jobId = newJob?.id;
      if (!jobId) {
        throw new Error("Failed to create job");
      }

      // Show immediate success message and close modal
      onJobAdded();
      onOpenChange(false);
      resetForm();
      toast({
        title: "Success",
        description: "Job added successfully"
      });

      // Generate PDF and create snapshot in the background
      if (jobDetails.url && jobDetails.rawHtml) {
        // Use setTimeout to ensure this runs after the modal is closed
        setTimeout(async () => {
          try {
            console.log('Generating PDF for URL:', jobDetails.url);
            const response = await fetch("/.netlify/functions/generate-job-pdf", {
              method: "POST",
              headers: {
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                url: jobDetails.url
              })
            });

            if (!response.ok) {
              const errorData = await response.text();
              console.error('PDF generation failed:', errorData);
              throw new Error(`Failed to generate PDF: ${response.status} ${response.statusText}`);
            }

            console.log('PDF generated successfully, uploading to storage...');
            const blob = await response.blob();
            const storageName = "pdf_snapshots";
            const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
            const fileName = `${getUserId(userId)}/${jobId}-${dateStr}.pdf`;

            console.log('Uploading PDF to storage:', fileName);
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

            // Create snapshot with PDF URL
            const { error: snapshotError } = await supabase
              .from("job_snapshots")
              .insert({
                job_id: jobId,
                user_id: getUserId(userId),
                position: jobDetails.position,
                company: jobDetails.company,
                description: jobDetails.description,
                keywords: jobDetails.keywords,
                url: jobDetails.url,
                html_content: jobDetails.rawHtml,
                created_at: new Date().toISOString(),
                pdf_url: fileName
              });

            if (snapshotError) {
              console.error("Error creating snapshot:", snapshotError);
              throw snapshotError;
            }

            // Show a descriptive notification about the Time Machine feature
            toast({
              title: `Time Machine Snapshot Created`,
              description: `A backup of "${jobDetails.position}" at ${jobDetails.company} has been saved. You can access this snapshot later using the Time Machine feature if the job posting becomes unavailable.`,
              duration: 5000
            });
          } catch (error) {
            console.error("Error creating snapshot:", error);
            // Show error toast but don't block the flow
            toast({
              variant: "destructive",
              title: "Time Machine Snapshot Failed",
              description: "The job was added successfully, but we couldn't create a backup snapshot. You can try creating one later through the Time Machine feature.",
              duration: 5000
            });
          }
        }, 100);
      }
    } catch (err) {
      console.error("Error saving job:", err);
      toast({
        variant: "destructive",
        title: "Error",
        description: err instanceof Error ? err.message : "Failed to save job"
      });
    } finally {
      setLoading(false);
    }
  }

  function handleCancel() {
    resetForm();
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add New Job</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AI Auto-fill Section */}
          <div className="relative rounded-lg border bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
            <div className="space-y-2">
              <Label className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Let AI do the work
              </Label>
              <p className="text-sm text-muted-foreground">
                Paste the job URL and let our AI extract all the details automatically
              </p>
              <div className="flex gap-2">
                <Input
                  value={url}
                  onChange={handleUrlChange}
                  placeholder="Paste the job posting URL here"
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={fetchDetails}
                  disabled={loading}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600 whitespace-nowrap"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Sparkles className="h-4 w-4 mr-2" />
                  )}
                  Auto-Fill
                </Button>
              </div>
            </div>
          </div>

          {/* Keywords Section */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              Key Skills & Requirements
              <Badge
                variant="secondary"
                className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white"
              >
                AI Extracted
              </Badge>
            </Label>
            <div className="min-h-20 p-4 bg-muted rounded-lg">
              {jobDetails.keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {jobDetails.keywords.map((keyword, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="text-sm py-1 px-3 bg-gradient-to-r from-yellow-100 to-orange-100"
                    >
                      {keyword}
                      <Sparkles className="h-3 w-3 ml-1 text-yellow-500 inline-block" />
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Use AI auto-fill to extract key skills & requirements from the job posting
                </div>
              )}
            </div>
          </div>

          {/* Manual Entry Section */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="position">Position</Label>
                <Input
                  id="position"
                  value={jobDetails.position}
                  onChange={(e) =>
                    setJobDetails((prev) => ({
                      ...prev,
                      position: e.target.value
                    }))
                  }
                  placeholder="e.g. Frontend Developer"
                  disabled={loading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company</Label>
                <Input
                  id="company"
                  value={jobDetails.company}
                  onChange={(e) =>
                    setJobDetails((prev) => ({
                      ...prev,
                      company: e.target.value
                    }))
                  }
                  placeholder="e.g. Acme Inc"
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={jobDetails.description}
                onChange={(e) =>
                  setJobDetails((prev) => ({
                    ...prev,
                    description: e.target.value
                  }))
                }
                placeholder="Enter job description"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Start Date */}
              <div>
                <Label>Start Date</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 min-w-0">
                    <Select
                      value={startDateType}
                      onValueChange={setStartDateType}
                    >
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
                  </div>
                </div>
              </div>

              {/* Deadline */}
              <div>
                <Label>Application Deadline</Label>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 min-w-0">
                    <Select
                      value={deadlineType}
                      onValueChange={setDeadlineType}
                    >
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
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">Job Posting URL (Optional)</Label>
              <Input
                id="url"
                value={jobDetails.url}
                onChange={(e) =>
                  setJobDetails((prev) => ({
                    ...prev,
                    url: e.target.value
                  }))
                }
                placeholder="https://..."
                disabled={loading}
                type="url"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Add Job
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
