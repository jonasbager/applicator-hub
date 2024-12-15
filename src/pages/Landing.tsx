import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { ArrowRight, CheckCircle2, Sparkles, Target } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/50">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-48 md:pt-40 md:pb-64">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-24">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
              Job Applications,{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                Simplified
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Stop juggling spreadsheets and emails. Track applications, analyze requirements,
              and stay organized throughout your job search journey.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="group">
                <Link to="/auth/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/auth/login">Sign In</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Hero Image */}
        <div className="absolute bottom-0 left-0 right-0 h-[500px] overflow-hidden">
          <div 
            className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background z-10"
            style={{
              background: 'linear-gradient(to bottom, transparent 70%, var(--background) 100%)'
            }}
          />
          <img 
            src="/heromockup.png" 
            alt="Applymate Dashboard" 
            className="w-full h-full object-cover object-top"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            Everything you need to manage your job search
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-background/50 backdrop-blur-sm p-6 rounded-xl border shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
              <p className="text-muted-foreground">
                Automatically extract key information from job postings. Get insights into required
                skills and qualifications.
              </p>
            </div>
            <div className="bg-background/50 backdrop-blur-sm p-6 rounded-xl border shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
              <p className="text-muted-foreground">
                Visual Kanban board to track your applications from "Not Started" to "Interview".
                Never lose track of where you stand.
              </p>
            </div>
            <div className="bg-background/50 backdrop-blur-sm p-6 rounded-xl border shadow-sm">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Stay Organized</h3>
              <p className="text-muted-foreground">
                Keep notes, track important dates, and link to your application documents.
                Everything in one place.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 md:py-24">
        <div className="container px-4 mx-auto">
          <h2 className="text-3xl font-bold text-center mb-16">
            Simple as 1, 2, 3
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary font-semibold">1</div>
              <h3 className="font-semibold text-xl mb-2">Add Job URL</h3>
              <p className="text-muted-foreground">
                Paste any job posting URL and let our AI analyze it for you
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary font-semibold">2</div>
              <h3 className="font-semibold text-xl mb-2">Track Progress</h3>
              <p className="text-muted-foreground">
                Move jobs through different stages as you apply and interview
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary font-semibold">3</div>
              <h3 className="font-semibold text-xl mb-2">Stay Organized</h3>
              <p className="text-muted-foreground">
                Keep all your application materials and notes in one place
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 md:py-24 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to streamline your job search?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join thousands of job seekers who are organizing their job search with Applymate.
            </p>
            <Button asChild size="lg" className="group">
              <Link to="/auth/signup">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t">
        <div className="container px-4 mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-sm text-muted-foreground">
              © 2024 Applymate. All rights reserved.
            </div>
            <div className="flex gap-6">
              <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
