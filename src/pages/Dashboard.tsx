import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { User, Session } from "@supabase/supabase-js";
import { toast } from "sonner";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { FinanceOverview } from "@/components/dashboard/FinanceOverview";
import { TransactionList } from "@/components/dashboard/TransactionList";
import { AddTransactionDialog } from "@/components/dashboard/AddTransactionDialog";
import { FinanceInsights } from "@/components/dashboard/FinanceInsights";
import { BudgetManager } from "@/components/dashboard/BudgetManager";
import { FinanceChatbot } from "@/components/dashboard/FinanceChatbot";
import { BudgetVsExpenseChart } from "@/components/dashboard/BudgetVsExpenseChart";
import { SpendingAlerts } from "@/components/dashboard/SpendingAlerts";
import type { Database } from "@/integrations/supabase/types";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];
type Transaction = Database["public"]["Tables"]["transactions"]["Row"];
type FinanceScore = Database["public"]["Tables"]["finance_scores"]["Row"];
type Budget = Database["public"]["Tables"]["budgets"]["Row"];

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [financeScore, setFinanceScore] = useState<FinanceScore | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (!session?.user) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    if (!user) return;

    setLoading(true);

    // Fetch profile
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profileError) {
      toast.error("Failed to load profile");
      console.error(profileError);
    } else {
      setProfile(profileData);
    }

    // Fetch transactions
    const { data: transactionsData, error: transactionsError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false });

    if (transactionsError) {
      toast.error("Failed to load transactions");
      console.error(transactionsError);
    } else {
      setTransactions(transactionsData || []);
    }

    // Fetch finance score
    const { data: scoreData, error: scoreError } = await supabase
      .from("finance_scores")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (scoreError) {
      console.error(scoreError);
    } else {
      setFinanceScore(scoreData);
    }

    // Fetch budgets
    const currentMonth = new Date();
    currentMonth.setDate(1);
    const { data: budgetData, error: budgetError } = await supabase
      .from("budgets")
      .select("*")
      .eq("user_id", user.id)
      .gte("month", currentMonth.toISOString());

    if (budgetError) {
      console.error(budgetError);
    } else {
      setBudgets(budgetData || []);
    }

    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const handleTransactionAdded = () => {
    fetchUserData();
  };

  if (loading || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <DashboardHeader profile={profile} onLogout={handleLogout} />
      
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="space-y-8">
          <FinanceOverview
            profile={profile}
            transactions={transactions}
            financeScore={financeScore}
          />

          <SpendingAlerts transactions={transactions} />

          <BudgetManager userId={user.id} transactions={transactions} />

          <BudgetVsExpenseChart budgets={budgets} transactions={transactions} />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TransactionList
                transactions={transactions}
                onTransactionAdded={handleTransactionAdded}
              />
            </div>
            
            <div>
              <FinanceInsights
                profile={profile}
                transactions={transactions}
                financeScore={financeScore}
              />
            </div>
          </div>

          <FinanceChatbot userId={user.id} />
        </div>

        <AddTransactionDialog onTransactionAdded={handleTransactionAdded} />
      </main>
    </div>
  );
};

export default Dashboard;