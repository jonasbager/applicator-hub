import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { useToast } from "./ui/use-toast";
import { scrapeJobDetails } from "../lib/job-scraping";
import { Loader2, Sparkles, Link as LinkIcon } from "lucide-react";
import { Badge } from "./ui/badge";
import { useAuth } from "@clerk/clerk-react";
import { JobStatus, DateValue } from "../types/job";
import { useSupabase } from "../lib/supabase";
import { Textarea } from "./ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";

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
  const [keywordsInput, setKeywordsInput] = useState("");

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    
    setLoading(true);

    try {
      // Process keywords if manually entered
      const processedKeywords = keywordsInput
        ? keywordsInput.split(',').map(k => k.trim()).filter(k => k)
        : jobDetails.keywords;

      const newJob = {
        ...jobDetails,
        keywords: processedKeywords,
        user_id: userId,
        archived: false,
        created_at: new Date().toISOString()
      };
      
      console.log('Creating job with data:', newJob);
      
      const { data, error } = await supabase
        .from('jobs')
        .insert([newJob])
        .select()
        .single();

      if (error) {
        console.error('Supabase error details:', error);
        throw error;
      }

      console.log('Job created successfully:', data);

      onJobAdded();
      onOpenChange(false);
      setUrl("");
      setJobDetails(initialJobState);
      setKeywordsInput("");
      
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add New Job</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="ai" className="relative">
              <Sparkles className="h-4 w-4 mr-2 text-yellow-500" />
              AI Auto-Fill
              <Badge variant="secondary" className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                PRO
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="manual">Manual Entry</TabsTrigger>
          </TabsList>

          <TabsContent value="ai">
            <Card>
              <CardHeader>
                <CardTitle>Let AI do the work</CardTitle>
                <CardDescription>
                  Paste the job URL and let our AI extract all the details automatically
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="Paste the job posting URL here"
                      disabled={loading}
                      className="pl-9"
                    />
                    <LinkIcon className="h-4 w-4 absolute left-3 top-3 text-muted-foreground" />
                  </div>
                  <Button
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
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual">
            <Card>
              <CardHeader>
                <CardTitle>Manual Entry</CardTitle>
                <CardDescription>
                  Enter the job details manually
                </CardDescription>
              </CardHeader>
              <CardContent>
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

                  <div className="space-y-2">
                    <Label htmlFor="keywords">Key Skills & Requirements</Label>
                    <Textarea
                      id="keywords"
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      placeholder="Enter skills separated by commas (e.g. React, TypeScript, Node.js)"
                      disabled={loading}
                      rows={2}
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
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Preview section - shows up regardless of tab */}
        {(jobDetails.position || jobDetails.company) && (
          <Card className="mt-4">
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold">{jobDetails.position || 'Position'}</h3>
                  <p className="text-muted-foreground">{jobDetails.company || 'Company'}</p>
                </div>
                {jobDetails.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {jobDetails.keywords.map((keyword, index) => (
                      <Badge 
                        key={index}
                        variant="secondary"
                        className="text-sm py-1 px-3"
                      >
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                )}
                {jobDetails.description && (
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {jobDetails.description}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading || !userId}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : null}
            Add Job
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
