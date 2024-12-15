import { Archive, Briefcase, LogOut, Plus } from "lucide-react";
import { cn } from "../lib/utils";
import { useAuth } from "../hooks/use-auth";
import { Button } from "./ui/button";
import { Link, useLocation } from "react-router-dom";

const menuItems = [
  { title: "Applications", icon: Briefcase, path: "/dashboard" },
  { title: "Archived", icon: Archive, path: "/archived" }
];

interface AppSidebarProps {
  onAddClick: () => void;
}

export function AppSidebar({ onAddClick }: AppSidebarProps) {
  const { signOut } = useAuth();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await signOut();
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
          className="w-full mb-6"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Application
        </Button>

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
