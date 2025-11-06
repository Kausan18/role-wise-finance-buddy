import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Wallet, TrendingUp, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import type { Database } from "@/integrations/supabase/types";

type Budget = Database["public"]["Tables"]["budgets"]["Row"];
type TransactionCategory = Database["public"]["Enums"]["transaction_category"];

interface BudgetManagerProps {
  userId: string;
  transactions: any[];
  monthlyIncome: number;
}

const categories: TransactionCategory[] = [
  "food", "rent", "entertainment", "transport", 
  "education", "healthcare", "shopping", "utilities", "other"
];

export const BudgetManager = ({ userId, transactions, monthlyIncome }: BudgetManagerProps) => {
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<TransactionCategory>("food");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  // Calculate if total budgets exceed income
  const totalBudgetsAmount = budgets.reduce((sum, b) => sum + Number(b.amount), 0);
  const showWarning = monthlyIncome > 0 && totalBudgetsAmount > monthlyIncome;

  useEffect(() => {
    fetchBudgets();
  }, [userId]);

  const fetchBudgets = async () => {
    const currentMonth = new Date();
    currentMonth.setDate(1);

    const { data, error } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId)
      .gte("month", currentMonth.toISOString());

    if (error) {
      console.error("Error fetching budgets:", error);
    } else {
      setBudgets(data || []);
    }
  };

  const handleSetBudget = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    // Calculate total budgets including new one
    const totalBudgets = budgets
      .filter(b => b.category !== selectedCategory)
      .reduce((sum, b) => sum + Number(b.amount), 0) + parseFloat(amount);

    if (monthlyIncome > 0 && totalBudgets > monthlyIncome) {
      toast.error("⚠️ Warning: Total budgets exceed your monthly income!", {
        description: `Total budgets: ₹${totalBudgets.toFixed(0)} > Income: ₹${monthlyIncome.toFixed(0)}`,
        duration: 5000,
      });
      return;
    }

    setLoading(true);
    const currentMonth = new Date();
    currentMonth.setDate(1);

    const { error } = await supabase
      .from("budgets")
      .upsert({
        user_id: userId,
        category: selectedCategory,
        amount: parseFloat(amount),
        month: currentMonth.toISOString().split('T')[0],
      }, {
        onConflict: 'user_id,category,month'
      });

    if (error) {
      toast.error("Failed to set budget");
      console.error(error);
    } else {
      toast.success("Budget updated successfully");
      setAmount("");
      fetchBudgets();
    }
    setLoading(false);
  };

  const calculateCategorySpending = (category: string) => {
    const currentMonth = new Date();
    currentMonth.setDate(1);
    
    return transactions
      .filter(t => 
        t.category === category && 
        t.type === "expense" &&
        new Date(t.date) >= currentMonth
      )
      .reduce((sum, t) => sum + Number(t.amount), 0);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          Monthly Budget Manager
        </CardTitle>
        <CardDescription>Set and track your budget for each category</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {showWarning && monthlyIncome > 0 && (
          <div className="bg-destructive/10 border border-destructive text-destructive px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="font-semibold">Budget Exceeds Income!</p>
              <p>Your total budgets exceed your monthly income. Consider reducing your budgets to avoid overspending.</p>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label>Category</Label>
            <Select value={selectedCategory} onValueChange={(val) => setSelectedCategory(val as TransactionCategory)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat} value={cat} className="capitalize">
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Budget Amount (₹)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="5000"
            />
          </div>
          <div className="flex items-end">
            <Button onClick={handleSetBudget} disabled={loading} className="w-full">
              Set Budget
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Budget Overview
          </h3>
          {budgets.length === 0 ? (
            <p className="text-muted-foreground text-sm">No budgets set for this month</p>
          ) : (
            <div className="space-y-3">
              {budgets.map((budget) => {
                const spent = calculateCategorySpending(budget.category);
                const percentage = (spent / Number(budget.amount)) * 100;
                const isOverBudget = percentage > 100;
                
                return (
                  <div key={budget.id} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize font-medium">{budget.category}</span>
                      <span className={isOverBudget ? "text-destructive font-semibold" : ""}>
                        ₹{spent.toFixed(0)} / ₹{Number(budget.amount).toFixed(0)}
                      </span>
                    </div>
                    <Progress value={Math.min(percentage, 100)} className="h-2" />
                    <div className="flex justify-between items-center text-xs text-muted-foreground">
                      <span>{percentage.toFixed(1)}% used</span>
                      {isOverBudget && (
                        <span className="text-destructive flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          Over budget!
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};