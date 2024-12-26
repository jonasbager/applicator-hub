import { Button } from "../components/ui/button";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export function NotFound() {
  const messages = [
    "Looks like this job opportunity got away!",
    "This position has been filled... by a 404 error.",
    "We've searched high and low, but this page is taking a sabbatical.",
    "Even with 10 years of experience, we couldn't find this page.",
    "This page must be remote working - we can't find it in the office!",
    "This page requires 5 years of experience with 404 errors.",
    "Sorry, this page is out of office indefinitely.",
    "This URL's application status: Not Found",
    "We regret to inform you that this page has moved on to other opportunities.",
    "This page ghosted us - just like some recruiters do!"
  ];

  const randomMessage = messages[Math.floor(Math.random() * messages.length)];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background pattern */}
      <div 
        className="absolute inset-0 bg-grid-small-black/[0.1] bg-gradient-to-b from-background via-background to-muted -z-10"
        style={{
          backgroundSize: '24px 24px',
          maskImage: 'linear-gradient(to bottom, transparent, black, transparent)'
        }}
      />
      
      {/* Radial gradient overlay */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,rgba(var(--primary),0.05),transparent)] -z-10" />
      
      <div className="text-center space-y-8 max-w-2xl mx-auto backdrop-blur-sm bg-background/50 p-8 rounded-xl shadow-lg border border-border/50 relative">
        {/* 404 Image */}
        <div className="relative w-64 h-64 mx-auto mb-8 group">
          <img 
            src="/404-image.png" 
            alt="404 Not Found" 
            className="w-full h-full object-contain transition-all duration-300 group-hover:scale-110 animate-[float_6s_ease-in-out_infinite]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/20 to-transparent pointer-events-none" />
        </div>

        {/* Error Code */}
        <h1 
          className="text-8xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-primary"
          style={{
            backgroundSize: '200% auto',
            animation: 'gradient 4s linear infinite'
          }}
        >404</h1>

        {/* Fun Message */}
        <p 
          className="text-2xl font-medium text-foreground"
          style={{
            animation: 'fadeIn 0.5s ease-out forwards'
          }}
        >
          {randomMessage}
        </p>

        {/* Helpful Subtext */}
        <p className="text-muted-foreground">
          Don't worry - there are plenty of other pages in the sea!
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
          <Button 
            asChild 
            size="lg"
            className="transition-transform hover:scale-105"
          >
            <Link to="/">
              <Home className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
          <Button 
            variant="outline" 
            onClick={() => window.history.back()} 
            size="lg"
            className="transition-transform hover:scale-105"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Go Back
          </Button>
        </div>
      </div>

      {/* Global animations */}
      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0) rotate(0deg); }
            25% { transform: translateY(-10px) rotate(2deg); }
            75% { transform: translateY(-5px) rotate(-2deg); }
          }
          @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}
      </style>
    </div>
  );
}
