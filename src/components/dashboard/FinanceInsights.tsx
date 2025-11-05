import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lightbulb, AlertCircle, TrendingUp } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type FinanceScore = Database["public"]["Tables"]["finance_scores"]["Row"];

interface FinanceInsightsProps {
  profile: Profile;
  transactions: Transaction[];
  financeScore: FinanceScore | null;
}

export const FinanceInsights = ({ profile, transactions, financeScore }: FinanceInsightsProps) => {
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const netSavings = totalIncome - totalExpenses;

  const getInsights = () => {
    const insights = [];

    // Role-based insights
    if (profile.role === "student") {
      if (netSavings > 0) {
        insights.push({
          type: "success",
          icon: TrendingUp,
          message: `Great job! You saved ₹${netSavings.toFixed(2)} this period. Keep building those saving habits!`,
        });
      } else {
        insights.push({
          type: "warning",
          icon: AlertCircle,
          message: "Try to track small daily expenses. Every rupee saved counts!",
        });
      }
      insights.push({
        type: "info",
        icon: Lightbulb,
        message: "Student tip: Set a monthly savings goal to build financial discipline early.",
      });
    } else if (profile.role === "professional") {
      if (totalIncome > 0) {
        const savingsRate = (netSavings / totalIncome) * 100;
        if (savingsRate >= 20) {
          insights.push({
            type: "success",
            icon: TrendingUp,
            message: `Excellent! You're saving ${savingsRate.toFixed(1)}% of your income. Consider investing in SIPs.`,
          });
        } else if (savingsRate > 0) {
          insights.push({
            type: "info",
            icon: Lightbulb,
            message: `You're saving ${savingsRate.toFixed(1)}% of your income. Try to reach the 20% benchmark.`,
          });
        } else {
          insights.push({
            type: "warning",
            icon: AlertCircle,
            message: "Your expenses exceed income. Review your spending and create a budget.",
          });
        }
      }
      insights.push({
        type: "info",
        icon: Lightbulb,
        message: "Professional tip: Build an emergency fund covering 6 months of expenses.",
      });
    } else if (profile.role === "family") {
      insights.push({
        type: "info",
        icon: Lightbulb,
        message: `Family budget: Total household expenses are ₹${totalExpenses.toFixed(2)}. Plan together for better savings.`,
      });
      if (netSavings > 0) {
        insights.push({
          type: "success",
          icon: TrendingUp,
          message: `Your family saved ₹${netSavings.toFixed(2)} this period. Great teamwork!`,
        });
      }
    }

    // Top spending category
    const expensesByCategory = transactions
      .filter((t) => t.type === "expense")
      .reduce((acc, t) => {
        const category = t.category;
        if (!acc[category]) acc[category] = 0;
        acc[category] += parseFloat(t.amount.toString());
        return acc;
      }, {} as Record<string, number>);

    const topCategory = Object.entries(expensesByCategory).sort((a, b) => b[1] - a[1])[0];
    if (topCategory) {
      insights.push({
        type: "info",
        icon: Lightbulb,
        message: `Top spending category: ${topCategory[0]} (₹${topCategory[1].toFixed(2)}). Consider setting a budget cap.`,
      });
    }

    return insights;
  };

  const insights = getInsights();

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-primary" />
          Financial Insights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <Alert
              key={index}
              variant={insight.type === "warning" ? "destructive" : "default"}
              className="border-border/50"
            >
              <Icon className="h-4 w-4" />
              <AlertDescription className="text-sm">{insight.message}</AlertDescription>
            </Alert>
          );
        })}
        
        {financeScore && (
          <div className="mt-4 p-4 rounded-lg bg-gradient-to-r from-primary/10 to-primary-glow/10 border border-primary/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Finance Health</span>
              <span className="text-xs text-muted-foreground">{financeScore.health_label}</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary to-primary-glow h-2 rounded-full transition-all"
                style={{ width: `${(financeScore.score / 1000) * 100}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Score: {financeScore.score} / 1000
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};