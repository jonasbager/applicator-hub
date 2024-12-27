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

        <div className="relative">
          <Button
            onClick={onAddClick}
            className={cn(
              "w-full mb-6 relative",
              !hasJobs && "animate-pulse-button"
            )}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Application
          </Button>

          {!hasJobs && (
            <>
              <div className="absolute -inset-[3px] rounded-lg animate-pulse-ring bg-primary/20" />
              <div className="absolute -inset-[3px] rounded-lg animate-pulse-ring animation-delay-500 bg-primary/20" />
            </>
          )}
        </div>

        {/* Add animations */}
        <style>
          {`
            @keyframes pulse-ring {
              0% {
                transform: scale(0.95);
                opacity: 0.7;
              }
              100% {
                transform: scale(1.2);
                opacity: 0;
              }
            }
            @keyframes pulse-button {
              0% {
                transform: scale(1);
              }
              50% {
                transform: scale(1.02);
                box-shadow: 0 0 0 2px var(--background), 0 0 0 4px rgb(var(--primary) / 0.3);
              }
              100% {
                transform: scale(1);
              }
            }
            .animate-pulse-ring {
              animation: pulse-ring 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            .animate-pulse-button {
              animation: pulse-button 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
            }
            .animation-delay-500 {
              animation-delay: 500ms;
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
