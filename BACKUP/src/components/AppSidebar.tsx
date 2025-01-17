import { Briefcase, LogOut, User } from "lucide-react";
import { cn } from "../lib/utils";
import { supabase } from "../lib/supabase";
import { useNavigate } from "react-router-dom";

const menuItems = [
  { title: "Applications", icon: Briefcase, url: "#", active: true },
  { title: "Profile", icon: User, url: "#" },
];

export function AppSidebar() {
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth/login");
  };

  return (
    <aside className="w-64 border-r bg-muted/30 h-screen sticky top-0 flex flex-col">
      <div className="p-6 flex-1">
        <div className="mb-8">
          <img 
            src="/logo.png" 
            alt="Applymate" 
            className="w-36"
          />
        </div>
        <nav>
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.title}>
                <a
                  href={item.url}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors",
                    "hover:bg-muted",
                    item.active && "bg-muted"
                  )}
                >
                  <item.icon className="h-5 w-5" />
                  <span>{item.title}</span>
                </a>
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
