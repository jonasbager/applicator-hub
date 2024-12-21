import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { ArrowRight, CheckCircle2, Sparkles, Target, Star } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/50">
      <Header />

      {/* Hero Section */}
      <section className="relative pt-32 pb-0 md:pt-40 overflow-hidden">
        <div className="container px-4 mx-auto">
          {/* Text content */}
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 mb-6 text-sm font-medium">
              <Star className="h-4 w-4" />
              Track applications with confidence
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Your Job Search,{" "}
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary to-primary/60">
                Organized
              </span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Stop juggling spreadsheets and emails. ApplyMate helps you track applications, 
              analyze requirements, and stay organized throughout your job search journey.
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

          {/* Hero Image */}
          <div className="relative w-full max-w-[1440px] mx-auto mt-20">
            <img 
              src="/heromockup.png" 
              alt="ApplyMate Dashboard" 
              className="w-full h-auto"
            />
            {/* Gradient overlay at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent pointer-events-none" />
          </div>
        </div>

        {/* Background decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-6xl -z-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-primary/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 md:py-32 bg-muted/30">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 mb-6 text-sm font-medium">
              <Target className="h-4 w-4" />
              Key Features
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything you need to manage your job search
            </h2>
            <p className="text-lg text-muted-foreground">
              A complete toolkit designed to make your job search efficient and organized
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-background/50 backdrop-blur-sm p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
              <p className="text-muted-foreground">
                Automatically extract key information from job postings. Get insights into required
                skills and qualifications.
              </p>
            </div>
            <div className="group bg-background/50 backdrop-blur-sm p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
              <p className="text-muted-foreground">
                Visual Kanban board to track your applications from "Not Started" to "Interview".
                Never lose track of where you stand.
              </p>
            </div>
            <div className="group bg-background/50 backdrop-blur-sm p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
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

      {/* CTA Section */}
      <section className="py-24 md:py-32">
        <div className="container px-4 mx-auto">
          <div className="max-w-4xl mx-auto text-center bg-background/80 backdrop-blur-sm rounded-3xl border p-12">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 mb-6 text-sm font-medium">
              <ArrowRight className="h-4 w-4" />
              Get Started Today
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-6">
              Ready to streamline your job search?
            </h2>
            <p className="text-xl text-muted-foreground mb-8">
              Join other job seekers who are organizing their job search with ApplyMate.
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
              © 2024 ApplyMate. All rights reserved.
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
