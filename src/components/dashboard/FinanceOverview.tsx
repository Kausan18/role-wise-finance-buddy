import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Wallet, Target } from "lucide-react";
import { SpendingChart } from "./SpendingChart";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type FinanceScore = Database["public"]["Tables"]["finance_scores"]["Row"];

interface FinanceOverviewProps {
  profile: Profile;
  transactions: Transaction[];
  financeScore: FinanceScore | null;
}

export const FinanceOverview = ({ profile, transactions, financeScore }: FinanceOverviewProps) => {
  const currentMonth = new Date();
  currentMonth.setDate(1);

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const currentMonthExpenses = transactions
    .filter((t) => t.type === "expense" && new Date(t.date) >= currentMonth)
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const monthlyIncome = Number(profile.monthly_income || 0);
  const availableBalance = monthlyIncome - currentMonthExpenses;
  const netSavings = totalIncome - totalExpenses;
  const savingsPercentage = totalIncome > 0 ? ((netSavings / totalIncome) * 100).toFixed(1) : 0;

  const getScoreColor = (score: number) => {
    if (score >= 850) return "text-success";
    if (score >= 700) return "text-primary";
    if (score >= 500) return "text-warning";
    return "text-destructive";
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/50 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${availableBalance < 0 ? 'text-destructive' : 'text-success'}`}>
              ₹{availableBalance.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              This month: ₹{monthlyIncome.toFixed(0)} - ₹{currentMonthExpenses.toFixed(0)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">₹{currentMonthExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Current month
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">₹{totalIncome.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              All time
            </p>
          </CardContent>
        </Card>

        <Card className="border-border/50 hover:shadow-lg transition-all">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finance Score</CardTitle>
            <Target className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financeScore ? getScoreColor(financeScore.score) : 'text-muted-foreground'}`}>
              {financeScore?.score || 500}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {financeScore?.health_label || 'Average'}
            </p>
          </CardContent>
        </Card>
      </div>

      <SpendingChart transactions={transactions} />
    </div>
  );
};