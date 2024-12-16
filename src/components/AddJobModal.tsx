import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { scrapeJobDetails, saveJob } from "../lib/job-scraping";
import { Loader2 } from "lucide-react";
import { Badge } from "./ui/badge";

interface AddJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onJobAdded: () => void;
}

export function AddJobModal({ open, onOpenChange, onJobAdded }: AddJobModalProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [jobDetails, setJobDetails] = useState({
    position: "",
    company: "",
    description: "",
    keywords: [] as string[],
    url: "",
  });

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
      setJobDetails({
        position: "",
        company: "",
        description: "",
        keywords: [],
        url: "",
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add New Job</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="url">Job Posting URL</Label>
            <div className="flex gap-2">
              <Input
                id="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste the job posting URL here"
                disabled={loading}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={fetchDetails}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  'Fetch'
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="position">Position</Label>
            <Input
              id="position"
              value={jobDetails.position}
              onChange={(e) =>
                setJobDetails({ ...jobDetails, position: e.target.value })
              }
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
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label>Key Skills & Requirements</Label>
            <div className="flex flex-wrap gap-2 p-4 bg-muted rounded-lg min-h-[100px]">
              {jobDetails.keywords.length > 0 ? (
                jobDetails.keywords.map((keyword, index) => (
                  <Badge 
                    key={index}
                    variant="secondary"
                    className="text-sm py-1 px-3"
                  >
                    {keyword}
                  </Badge>
                ))
              ) : (
                <div className="text-muted-foreground text-sm">
                  Keywords will appear here after fetching job details
                </div>
              )}
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
