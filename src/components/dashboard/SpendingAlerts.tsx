import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, TrendingUp, TrendingDown, CheckCircle } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

interface SpendingAlertsProps {
  transactions: Transaction[];
}

export const SpendingAlerts = ({ transactions }: SpendingAlertsProps) => {
  const now = new Date();
  const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const currentMonthSpending = transactions
    .filter(t => new Date(t.date) >= currentMonth && t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const previousMonthSpending = transactions
    .filter(t => 
      new Date(t.date) >= previousMonth && 
      new Date(t.date) <= previousMonthEnd && 
      t.type === "expense"
    )
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const alerts = [];

  if (previousMonthSpending > 0) {
    const percentChange = ((currentMonthSpending - previousMonthSpending) / previousMonthSpending * 100);
    
    if (percentChange > 10) {
      alerts.push({
        type: "warning",
        title: "Spending Increased",
        description: `You've spent ${percentChange.toFixed(1)}% more this month (₹${currentMonthSpending.toFixed(0)}) compared to last month (₹${previousMonthSpending.toFixed(0)}).`,
        icon: TrendingUp
      });
    } else if (percentChange < -10) {
      alerts.push({
        type: "success",
        title: "Great Progress!",
        description: `You've reduced spending by ${Math.abs(percentChange).toFixed(1)}% this month. Keep it up!`,
        icon: TrendingDown
      });
    } else {
      alerts.push({
        type: "info",
        title: "Steady Spending",
        description: `Your spending is relatively stable compared to last month.`,
        icon: CheckCircle
      });
    }
  }

  // Category with highest spending
  const categorySpending: Record<string, number> = {};
  transactions
    .filter(t => t.type === "expense" && new Date(t.date) >= currentMonth)
    .forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + Number(t.amount);
    });

  const topCategory = Object.entries(categorySpending).sort((a, b) => b[1] - a[1])[0];
  if (topCategory) {
    alerts.push({
      type: "info",
      title: "Top Spending Category",
      description: `Your highest expense this month is ${topCategory[0]} at ₹${topCategory[1].toFixed(0)}. Consider reviewing if this aligns with your priorities.`,
      icon: AlertCircle
    });
  }

  return (
    <div className="space-y-4">
      {alerts.map((alert, idx) => {
        const Icon = alert.icon;
        return (
          <Alert 
            key={idx} 
            variant={alert.type === "warning" ? "destructive" : "default"}
            className={
              alert.type === "success" 
                ? "border-green-500 bg-green-50 dark:bg-green-950" 
                : alert.type === "info"
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950"
                : ""
            }
          >
            <Icon className="h-4 w-4" />
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>{alert.description}</AlertDescription>
          </Alert>
        );
      })}
    </div>
  );
};