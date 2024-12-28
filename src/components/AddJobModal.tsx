import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { scrapeJobDetails } from "../lib/job-scraping";
import { Loader2, Sparkles } from "lucide-react";
import { Badge } from "./ui/badge";
import { useAuth } from "@clerk/clerk-react";
import { JobStatus, DateValue } from "../types/job";
import { useSupabase } from "../lib/supabase";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

interface JobFormState {
  position: string;
  company: string;
  description: string;
  keywords: string[];
  url: string;
  status: JobStatus;
  notes: string[];
  application_draft_url: string;
  deadline: DateValue;
  start_date: DateValue;
}

interface AddJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobAdded: () => void;
}

const initialJobState: JobFormState = {
  position: "",
  company: "",
  description: "",
  keywords: [],
  url: "",
  status: 'Not Started',
  notes: [],
  application_draft_url: "",
  deadline: null,
  start_date: null
};

export function AddJobModal({ open, onOpenChange, onJobAdded }: AddJobModalProps) {
  const { userId } = useAuth();
  const { supabase } = useSupabase();
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [jobDetails, setJobDetails] = useState<JobFormState>(initialJobState);

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
      const details = await scrapeJobDetails(url);
      console.log('Scraped details:', details);
      setJobDetails({
        ...jobDetails,
        ...details,
        url: url // Ensure we store the input URL
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

  const saveJob = async (job: JobFormState) => {
    if (!userId) throw new Error('Not authenticated');
    
    const { error } = await supabase
      .from('jobs')
      .insert([{
        ...job,
        user_id: userId,
        archived: false,
        created_at: new Date().toISOString()
      }]);

    if (error) throw error;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await saveJob(jobDetails);
      toast({
        title: "Success",
        description: "Job added successfully",
      });
      onJobAdded();
      onOpenChange(false);
      setUrl("");
      setJobDetails(initialJobState);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add New Job</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* AI Auto-fill Section */}
          <div className="relative rounded-lg border bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
            <Badge variant="secondary" className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
              PRO
            </Badge>
            <div className="space-y-2">
              <Label className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-yellow-500" />
                Let AI do the work
              </Label>
              <p className="text-sm text-muted-foreground">
                Paste the job URL and let our AI extract all the details automatically, including key skills & requirements
              </p>
              <div className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Paste the job posting URL here"
                  disabled={loading}
                />
                <Button
                  type="button"
                  onClick={fetchDetails}
                  disabled={loading}
                  className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white hover:from-yellow-600 hover:to-orange-600"
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
                    setJobDetails({ ...jobDetails, position: e.target.value })
                  }
                  placeholder="e.g. Frontend Developer"
                  disabled={loading}
                  required
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
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={jobDetails.description}
                onChange={(e) =>
                  setJobDetails({ ...jobDetails, description: e.target.value })
                }
                placeholder="Enter job description"
                disabled={loading}
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="deadline">Application Deadline</Label>
                <Select
                  value={jobDetails.deadline?.toString() || ""}
                  onValueChange={(value) =>
                    setJobDetails({ ...jobDetails, deadline: value as DateValue })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select deadline" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASAP">ASAP</SelectItem>
                    <SelectItem value="">Unknown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Select
                  value={jobDetails.start_date?.toString() || ""}
                  onValueChange={(value) =>
                    setJobDetails({ ...jobDetails, start_date: value as DateValue })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select start date" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ASAP">ASAP</SelectItem>
                    <SelectItem value="">Unknown</SelectItem>
                  </SelectContent>
                </Select>
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
              onClick={() => onOpenChange(false)}
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
