import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import type { Database } from "@/integrations/supabase/types";

type Budget = Database["public"]["Tables"]["budgets"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions"]["Row"];

interface BudgetVsExpenseChartProps {
  budgets: Budget[];
  transactions: Transaction[];
}

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6', '#f97316'];

export const BudgetVsExpenseChart = ({ budgets, transactions }: BudgetVsExpenseChartProps) => {
  const currentMonth = new Date();
  currentMonth.setDate(1);

  // Calculate spending by category
  const categorySpending: Record<string, number> = {};
  transactions
    .filter(t => t.type === "expense" && new Date(t.date) >= currentMonth)
    .forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + Number(t.amount);
    });

  // Prepare data for bar chart
  const barData = budgets.map(budget => ({
    category: budget.category,
    Budget: Number(budget.amount),
    Spent: categorySpending[budget.category] || 0,
  }));

  // Prepare data for pie chart
  const pieData = Object.entries(categorySpending).map(([category, amount]) => ({
    name: category,
    value: amount,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Budget vs Actual Spending</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" className="capitalize text-xs" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Budget" fill="#8b5cf6" />
              <Bar dataKey="Spent" fill="#06b6d4" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Spending Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};