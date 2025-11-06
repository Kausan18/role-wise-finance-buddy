import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Wallet, TrendingUp } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface IncomeSetupProps {
  profile: Profile;
  onIncomeUpdated: () => void;
}

export const IncomeSetup = ({ profile, onIncomeUpdated }: IncomeSetupProps) => {
  const [income, setIncome] = useState(profile.monthly_income?.toString() || "");
  const [loading, setLoading] = useState(false);

  const getIncomeLabel = () => {
    switch (profile.role) {
      case "student":
        return "Monthly Allowance";
      case "professional":
        return "Monthly Salary";
      case "family":
        return "Monthly Family Income";
      default:
        return "Monthly Income";
    }
  };

  const handleUpdateIncome = async () => {
    if (!income || parseFloat(income) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    const { error } = await supabase
      .from("profiles")
      .update({ monthly_income: parseFloat(income) })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to update income");
      console.error(error);
    } else {
      toast.success(`${getIncomeLabel()} updated successfully`);
      onIncomeUpdated();
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {getIncomeLabel()}
        </CardTitle>
        <CardDescription>
          {profile.role === "student" 
            ? "Set your monthly allowance to track your spending better"
            : "Set your monthly income to manage your budget effectively"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-2">
            <Label>{getIncomeLabel()} (₹)</Label>
            <Input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder={profile.role === "student" ? "5000" : "50000"}
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleUpdateIncome} disabled={loading} className="w-full">
              <Wallet className="h-4 w-4 mr-2" />
              Update
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
