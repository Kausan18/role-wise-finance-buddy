import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface DashboardHeaderProps {
  profile: Profile;
  onLogout: () => void;
}

const roleEmoji = {
  student: "🎓",
  professional: "💼",
  family: "👨‍👩‍👧‍👦",
};

const roleLabel = {
  student: "Student",
  professional: "Professional",
  family: "Family",
};

export const DashboardHeader = ({ profile, onLogout }: DashboardHeaderProps) => {
  return (
    <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between max-w-7xl">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            FinanceFlow
          </h1>
          <p className="text-sm text-muted-foreground">
            {roleEmoji[profile.role]} {roleLabel[profile.role]} Dashboard
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="text-right hidden sm:block">
            <p className="font-medium text-foreground">{profile.name}</p>
            <p className="text-sm text-muted-foreground capitalize">
              {roleLabel[profile.role]}
            </p>
          </div>
          
          <Button variant="outline" size="icon" onClick={onLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </header>
  );
};