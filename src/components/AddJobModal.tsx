import { useState, useEffect, useCallback } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { scrapeJobDetails } from "../lib/job-scraping";
import { Loader2, Sparkles } from "lucide-react";
import { Badge } from "./ui/badge";
import { useAuth } from "@clerk/clerk-react";
import { JobStatus } from "../types/job";
import { JobPreferences } from "../types/resume";
import { calculateMatchPercentage } from "../lib/job-matching-utils";
import { useSupabase } from "../lib/supabase";
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
  const [jobDetails, setJobDetails] = useState({
    position: "",
    company: "",
    description: "",
    keywords: [] as string[],
    url: "",
  });
  const [deadline, setDeadline] = useState<string>("");
  const [deadlineType, setDeadlineType] = useState<string>("unknown");
  const [startDate, setStartDate] = useState<string>("");
  const [startDateType, setStartDateType] = useState<string>("unknown");

  // Reset form when modal closes
  // Load user preferences
  useEffect(() => {
    async function loadPreferences() {
      if (!userId) return;
      
      try {
        const { data, error } = await supabase
          .from('job_preferences')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        setPreferences(data);
      } catch (error) {
        console.error('Error loading preferences:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load preferences'
        });
      }
    }

    loadPreferences();
  }, [userId, supabase]);

  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setUrl("");
    setJobDetails({
      position: "",
      company: "",
      description: "",
      keywords: [],
      url: "",
    });
    setDeadline("");
    setDeadlineType("unknown");
    setStartDate("");
    setStartDateType("unknown");
  };

  const getLinkedInJobUrl = (url: string): string => {
    try {
      // Extract job ID from URL
      const jobId = url.match(/(?:currentJobId=|jobs\/view\/)(\d+)/)?.[1];
      if (!jobId) {
        return url;
      }

      // Convert to direct job URL
      return `https://www.linkedin.com/jobs/view/${jobId}`;
    } catch (error) {
      console.error('Error parsing LinkedIn URL:', error);
      return url;
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    
    // If it's a LinkedIn URL, convert it to direct job URL immediately
    if (newUrl.includes('linkedin.com/jobs')) {
      const directUrl = getLinkedInJobUrl(newUrl);
      console.log('Converting LinkedIn URL:', { original: newUrl, direct: directUrl });
      setUrl(directUrl);
      // Also update jobDetails.url to keep them in sync
      setJobDetails(prev => ({ ...prev, url: directUrl }));
    } else {
      setUrl(newUrl);
      setJobDetails(prev => ({ ...prev, url: newUrl }));
    }
  };

  // Keep URL fields in sync
  useEffect(() => {
    if (jobDetails.url !== url) {
      setUrl(jobDetails.url);
    }
  }, [jobDetails.url]);

  const fetchDetails = async () => {
    if (!url) {
      toast({
        variant: "destructive",
        title: "URL required",
        description: "Please enter a job posting URL",
      });
      return;
    }

    setLoading(true);
    try {
      // No need to convert URL here since we do it on input change
      console.log('Scraping URL:', url);
      
      const details = await scrapeJobDetails(url);
      console.log('Scraped details:', details);
      setJobDetails({
        ...jobDetails,
        ...details,
        url: url // Use the already converted URL
      });
      toast({
        title: "Success",
        description: "Job details extracted successfully",
      });
    } catch (error) {
      console.error("Error fetching job details:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to fetch job details",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setLoading(true);

    try {
      const finalDeadline = deadlineType === 'ASAP' ? 'ASAP' : 
                           deadlineType === 'custom' ? deadline : null;
      const finalStartDate = startDateType === 'ASAP' ? 'ASAP' : 
                           startDateType === 'custom' ? startDate : null;

      // Calculate match percentage
      let matchPercentage: number | undefined;
      if (preferences) {
        matchPercentage = calculateMatchPercentage(
          jobDetails.keywords,
          jobDetails.position,
          preferences
        );
      }

      const { error } = await supabase
        .from('jobs')
        .insert([{
          user_id: userId,
          position: jobDetails.position,
          company: jobDetails.company,
          description: jobDetails.description,
          keywords: jobDetails.keywords,
          url: jobDetails.url,
          status: 'Not Started' as JobStatus,
          notes: [],
          application_draft_url: '',
          archived: false,
          created_at: new Date().toISOString(),
          deadline: finalDeadline,
          start_date: finalStartDate,
          match_percentage: matchPercentage
        }]);

      if (error) throw error;

      onJobAdded();
      onOpenChange(false);
      resetForm();
      
      toast({
        title: "Success",
        description: "Job added successfully",
      });
    } catch (error) {
      console.error("Error saving job:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save job",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onOpenChange(false);
  };

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
              <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                AI Extracted
              </Badge>
            </Label>
            <div className="min-h-20 p-4 bg-muted rounded-lg">
              {jobDetails.keywords.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {jobDetails.keywords.map((keyword: string, index: number) => (
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
                    setJobDetails({ ...jobDetails, position: e.target.value })
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
                    setJobDetails({ ...jobDetails, company: e.target.value })
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
                  setJobDetails({ ...jobDetails, description: e.target.value })
                }
                placeholder="Enter job description"
                disabled={loading}
              />
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <Label>Start Date</Label>
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
                  </div>
                </div>
              </div>

              <div>
                <Label>Application Deadline</Label>
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
                  setJobDetails({ ...jobDetails, url: e.target.value })
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
