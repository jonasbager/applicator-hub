import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { JobCard } from "@/components/JobCard";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

const mockJobs = [
  {
    company: "TechCorp Inc.",
    position: "Senior Frontend Developer",
    deadline: "2024-03-15",
    matchRate: 85,
    connections: 3,
    documents: ["CV", "Cover Letter"],
    status: "In Progress",
  },
  {
    company: "Innovation Labs",
    position: "Full Stack Engineer",
    deadline: "2024-03-20",
    matchRate: 92,
    connections: 5,
    documents: ["CV", "Portfolio"],
    status: "Not Started",
  },
  {
    company: "Digital Solutions",
    position: "React Developer",
    deadline: "2024-03-10",
    matchRate: 78,
    connections: 2,
    documents: ["CV", "Cover Letter", "References"],
    status: "Submitted",
  },
] as const;

const Index = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold">Job Applications</h1>
                <p className="text-muted-foreground">Track and manage your job applications</p>
              </div>
              <Button className="flex items-center gap-2">
                <PlusCircle className="h-5 w-5" />
                Add Application
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockJobs.map((job) => (
                <JobCard key={`${job.company}-${job.position}`} {...job} />
              ))}
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Index;