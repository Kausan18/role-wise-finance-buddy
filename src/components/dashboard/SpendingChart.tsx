import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";
import type { Database } from "@/integrations/supabase/types";

type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

interface SpendingChartProps {
  transactions: Transaction[];
}

const COLORS = {
  food: "hsl(var(--warning))",
  rent: "hsl(var(--primary))",
  entertainment: "hsl(var(--accent))",
  transport: "hsl(var(--success))",
  education: "hsl(195 70% 50%)",
  healthcare: "hsl(0 70% 60%)",
  shopping: "hsl(280 65% 55%)",
  utilities: "hsl(35 75% 50%)",
  other: "hsl(var(--muted-foreground))",
};

const categoryLabels = {
  food: "Food",
  rent: "Rent",
  entertainment: "Entertainment",
  transport: "Transport",
  education: "Education",
  healthcare: "Healthcare",
  shopping: "Shopping",
  utilities: "Utilities",
  other: "Other",
};

export const SpendingChart = ({ transactions }: SpendingChartProps) => {
  const expenseTransactions = transactions.filter((t) => t.type === "expense");

  const categoryData = expenseTransactions.reduce((acc, transaction) => {
    const category = transaction.category;
    const amount = parseFloat(transaction.amount.toString());
    
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += amount;
    
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(categoryData).map(([category, value]) => ({
    name: categoryLabels[category as keyof typeof categoryLabels],
    value,
    color: COLORS[category as keyof typeof COLORS],
  }));

  if (chartData.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle>Spending Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="h-64 flex items-center justify-center">
          <p className="text-muted-foreground">No expense data to display</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle>Spending Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};