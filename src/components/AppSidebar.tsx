import { Archive, Briefcase, LogOut, Plus } from "lucide-react";
import { cn } from "../lib/utils";
import { useClerk } from "@clerk/clerk-react";
import { Button } from "./ui/button";
import { Link, useLocation, useNavigate } from "react-router-dom";

const menuItems = [
  { title: "Applications", icon: Briefcase, path: "/jobs" },
  { title: "Archived", icon: Archive, path: "/archived" }
];

interface AppSidebarProps {
  onAddClick: () => void;
  hasJobs: boolean;
}

export function AppSidebar({ onAddClick, hasJobs }: AppSidebarProps) {
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <aside className="w-64 border-r bg-white h-screen sticky top-0 flex flex-col">
      <div className="p-6 flex-1">
        <div className="mb-8">
          <img 
            src="/logo.png" 
            alt="Applymate" 
            className="w-36"
          />
        </div>

        <Button
          onClick={onAddClick}
          className={cn(
            "w-full mb-6 relative",
            !hasJobs && "animate-pulse-ring"
          )}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Application
          {!hasJobs && (
            <span className="absolute inset-0 rounded-md animate-pulse-border" />
          )}
        </Button>

        {/* Add animations */}
        <style>
          {`
            @keyframes pulseRing {
              0% {
                box-shadow: 0 0 0 0 rgba(var(--primary), 0.7);
              }
              70% {
                box-shadow: 0 0 0 10px rgba(var(--primary), 0);
              }
              100% {
                box-shadow: 0 0 0 0 rgba(var(--primary), 0);
              }
            }
            @keyframes pulseBorder {
              0% {
                border: 2px solid rgba(var(--primary), 0.7);
              }
              70% {
                border: 2px solid rgba(var(--primary), 0);
              }
              100% {
                border: 2px solid rgba(var(--primary), 0.7);
              }
            }
            .animate-pulse-ring {
              animation: pulseRing 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            .animate-pulse-border {
              animation: pulseBorder 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
          `}
        </style>

        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.title}>
                <Link
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    "hover:bg-muted",
                    location.pathname === item.path && "bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="p-6 border-t">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-500/10 w-full transition-colors"
        >
          <LogOut className="h-5 w-5" />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
