import { Link } from "react-router-dom";
import { Button } from "./ui/button";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm border-b" />
      <div className="container mx-auto px-4 relative">
        <div className="flex items-center justify-between h-24">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="ApplyMate" className="h-14 w-auto" />
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <Button asChild variant="ghost" className="text-base">
              <Link to="/sign-in">Log in</Link>
            </Button>
            <Button asChild className="text-base">
              <Link to="/sign-up">Sign up free</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
