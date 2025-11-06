import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Wallet, TrendingUp } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface IncomeManagerProps {
  profile: Profile;
  onIncomeUpdated: () => void;
}

export const IncomeManager = ({ profile, onIncomeUpdated }: IncomeManagerProps) => {
  const [income, setIncome] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile.monthly_income) {
      setIncome(profile.monthly_income.toString());
    }
  }, [profile]);

  const handleSetIncome = async () => {
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
      const incomeLabel = profile.role === "student" ? "allowance" : "income";
      toast.success(`Monthly ${incomeLabel} updated successfully`);
      onIncomeUpdated();
    }
    setLoading(false);
  };

  const incomeLabel = profile.role === "student" ? "Monthly Allowance" : "Monthly Income";
  const incomeDescription = profile.role === "student" 
    ? "Set your monthly allowance to track your spending" 
    : "Set your monthly income to track your finances";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          {incomeLabel}
        </CardTitle>
        <CardDescription>{incomeDescription}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>{incomeLabel} (₹)</Label>
            <Input
              type="number"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="50000"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSetIncome} disabled={loading} className="w-full">
              <TrendingUp className="h-4 w-4 mr-2" />
              Update {incomeLabel}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
