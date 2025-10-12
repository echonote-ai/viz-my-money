import { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { TrendingUp, LogOut } from "lucide-react";

interface DashboardHeaderProps {
  user: User | null;
  onSignOut: () => void;
}

const DashboardHeader = ({ user, onSignOut }: DashboardHeaderProps) => {
  return (
    <header className="border-b bg-card shadow-sm">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center">
            <TrendingUp className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">SpendSmart</h1>
            <p className="text-sm text-muted-foreground">Financial clarity, simplified</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm text-muted-foreground">Signed in as</p>
            <p className="text-sm font-medium">{user?.email}</p>
          </div>
          <Button variant="outline" size="sm" onClick={onSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
