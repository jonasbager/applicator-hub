import { Link } from "react-router-dom";
import { Button } from "./ui/button";

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <img src="/logo.png" alt="Applymate" className="h-8 w-auto" />
            <span className="font-bold text-xl">Applymate</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-4">
            <Button asChild variant="ghost">
              <Link to="/auth/login">Log in</Link>
            </Button>
            <Button asChild>
              <Link to="/auth/signup">Sign up</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
