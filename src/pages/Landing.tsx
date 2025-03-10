import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { Header } from "../components/Header";
import { ArrowRight, CheckCircle2, Sparkles, Target, Star, History, Brain, Quote, Clock, FileText } from "lucide-react";
import { useState } from "react";
import { TrustedUsers } from "../components/ui/trusted-users";
import { Badge } from "../components/ui/badge";

// Mock reviews data
const reviews = [
  {
    name: "Sarah M.",
    text: "ApplyMate's CV matching feature helped me focus on jobs that were the best fit for my skills. Landed my dream job in just 6 weeks!",
    rating: 5
  },
  {
    name: "Henrik L.",
    text: "The Time Machine feature is a game-changer. Being able to reference job posts even after they're taken down is incredibly valuable.",
    rating: 5
  },
  {
    name: "Emilie R.",
    text: "Finally, a job application tracker that actually understands what job seekers need. The AI analysis saves me so much time!",
    rating: 5
  }
];

export default function Landing() {
  const [activeReview, setActiveReview] = useState(0);

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
                <Link to="/sign-up">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link to="/sign-in">Sign In</Link>
              </Button>
            </div>

            {/* Trusted Users */}
            <div className="flex justify-center mt-8">
              <TrustedUsers />
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative w-full max-w-[1440px] mx-auto mt-12 group">
            <img 
              src="/heromockup.png" 
              alt="ApplyMate Dashboard" 
              className="w-full h-auto transition-transform duration-500 group-hover:scale-[1.02]"
            />
          </div>
        </div>

        {/* Background decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full max-w-6xl -z-10">
          <div className="absolute top-0 left-0 w-72 h-72 bg-primary/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob" />
          <div className="absolute top-0 right-0 w-72 h-72 bg-primary/20 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000" />
          <div className="absolute bottom-0 left-1/2 w-72 h-72 bg-primary/40 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000" />
        </div>
      </section>

      {/* Time Machine Feature Section */}
      <section className="py-24 md:py-32 bg-gradient-to-br from-orange-500/5 to-yellow-500/5">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 rounded-full px-4 py-1.5 mb-6 text-sm font-medium">
              <History className="h-4 w-4" />
              Introducing Time Machine
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Never Lose Track of Job Details Again
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Our revolutionary Time Machine feature automatically preserves every job posting,
              ensuring you always have access to the complete details - even after the listing is removed.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button asChild size="lg" className="group bg-orange-500 hover:bg-orange-600">
                <Link to="/sign-up">
                  Try Time Machine Now
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-background/80 backdrop-blur-sm p-6 rounded-xl border">
                <div className="w-12 h-12 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center mb-4">
                  <Clock className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Automatic Snapshots</h3>
                <p className="text-muted-foreground text-sm">
                  Every job posting is automatically preserved the moment you add it to your board
                </p>
              </div>
              <div className="bg-background/80 backdrop-blur-sm p-6 rounded-xl border">
                <div className="w-12 h-12 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Complete Details</h3>
                <p className="text-muted-foreground text-sm">
                  Every aspect of the job posting is preserved, from requirements to benefits
                </p>
              </div>
              <div className="bg-background/80 backdrop-blur-sm p-6 rounded-xl border">
                <div className="w-12 h-12 bg-orange-100 text-orange-700 rounded-lg flex items-center justify-center mb-4">
                  <History className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Always Available</h3>
                <p className="text-muted-foreground text-sm">
                  Access your preserved job postings anytime, even years after they're taken down
                </p>
              </div>
            </div>
          </div>
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
            <p className="text-lg text-muted-foreground mb-8">
              A complete toolkit designed to make your job search efficient and organized
            </p>
            <Button asChild size="lg" className="group mb-12">
              <Link to="/sign-up">
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="group bg-background/50 backdrop-blur-sm p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">AI-Powered Analysis</h3>
              <p className="text-muted-foreground">
                Our AI analyzes job postings to extract key requirements, skills, and qualifications.
                Get instant insights into what employers are looking for and how you match up.
              </p>
            </div>
            <div className="group bg-background/50 backdrop-blur-sm p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Progress Tracking</h3>
              <p className="text-muted-foreground">
                Intuitive Kanban board lets you drag and drop applications through each stage.
                Track deadlines, interviews, and follow-ups all in one visual dashboard.
              </p>
            </div>
            <div className="group bg-background/50 backdrop-blur-sm p-8 rounded-2xl border shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Stay Organized</h3>
              <p className="text-muted-foreground">
                Keep everything in one place - application materials, interview notes, important dates,
                and company research. Never miss a deadline or lose track of your progress.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Job Matching Feature */}
      <section className="py-24 md:py-32">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 mb-6 text-sm font-medium">
              <Brain className="h-4 w-4" />
              Smart Matching
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Find Your Perfect Match
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Let our AI analyze job postings and match them with your skills and experience
            </p>
            <Button asChild size="lg" className="group mb-12">
              <Link to="/sign-up">
                Start Matching Now
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>
          </div>
          <div className="relative bg-gradient-to-br from-background to-muted/30 p-8 rounded-2xl border shadow-sm overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-lg flex items-center justify-center">
                  <Brain className="h-6 w-6 text-purple-500" />
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs">
                  95% Match
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div>
                  <h3 className="text-lg font-semibold mb-2">AI-Powered Analysis</h3>
                  <p className="text-muted-foreground text-sm">
                    Our AI extracts and analyzes key requirements from job postings
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Skill Matching</h3>
                  <p className="text-muted-foreground text-sm">
                    Compare your skills against job requirements for perfect matches
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Smart Recommendations</h3>
                  <p className="text-muted-foreground text-sm">
                    Get personalized job recommendations based on your profile
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-24 md:py-32 bg-gradient-to-b from-muted/30 to-background">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary rounded-full px-4 py-1.5 mb-6 text-sm font-medium">
              <Quote className="h-4 w-4" />
              User Reviews
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What our users say
            </h2>
            <p className="text-lg text-muted-foreground">
              Join thousands of job seekers who have streamlined their job search with ApplyMate
            </p>
          </div>

          {/* Reviews Carousel */}
          <div className="max-w-4xl mx-auto">
            <div className="relative bg-background/80 backdrop-blur-sm rounded-3xl border p-8 md:p-12 transition-all duration-300">
              <div className="flex flex-col items-center text-center">
                <div className="flex gap-1 mb-6">
                  {[...Array(reviews[activeReview].rating)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <blockquote className="text-xl md:text-2xl font-medium mb-6 transition-all duration-300">
                  "{reviews[activeReview].text}"
                </blockquote>
                <div className="text-muted-foreground">
                  <div className="font-semibold">{reviews[activeReview].name}</div>
                </div>
              </div>

              {/* Review Navigation */}
              <div className="flex justify-center gap-2 mt-8">
                {reviews.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setActiveReview(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === activeReview 
                        ? 'bg-primary w-8' 
                        : 'bg-primary/20 hover:bg-primary/40'
                    }`}
                    aria-label={`Go to review ${index + 1}`}
                  />
                ))}
              </div>
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
              <Link to="/sign-up">
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
