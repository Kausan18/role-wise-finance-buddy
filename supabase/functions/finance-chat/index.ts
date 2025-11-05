import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.79.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userId } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Create Supabase client to fetch user data
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch user's transactions and budgets
    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(100);

    const { data: budgets } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);

    // Calculate current month and previous month spending
    const now = new Date();
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const previousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const currentMonthSpending = transactions?.filter(t => 
      new Date(t.date) >= currentMonth && t.type === 'expense'
    ).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const previousMonthSpending = transactions?.filter(t => 
      new Date(t.date) >= previousMonth && new Date(t.date) <= previousMonthEnd && t.type === 'expense'
    ).reduce((sum, t) => sum + Number(t.amount), 0) || 0;

    const spendingIncrease = previousMonthSpending > 0 
      ? ((currentMonthSpending - previousMonthSpending) / previousMonthSpending * 100).toFixed(1)
      : 0;

    // Calculate category-wise spending
    const categorySpending: Record<string, number> = {};
    transactions?.filter(t => t.type === 'expense' && new Date(t.date) >= currentMonth).forEach(t => {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + Number(t.amount);
    });

    // Calculate budget vs actual
    const budgetAnalysis = budgets?.map(b => {
      const spent = categorySpending[b.category] || 0;
      const remaining = Number(b.amount) - spent;
      const percentage = (spent / Number(b.amount) * 100).toFixed(1);
      return {
        category: b.category,
        budget: b.amount,
        spent,
        remaining,
        percentage
      };
    }) || [];

    const systemPrompt = `You are a personal finance assistant. Analyze the user's financial data and provide helpful insights.

Current Month Data:
- Total Spending: ₹${currentMonthSpending}
- Previous Month Spending: ₹${previousMonthSpending}
- Spending Change: ${spendingIncrease}%

Category Spending (Current Month):
${Object.entries(categorySpending).map(([cat, amt]) => `- ${cat}: ₹${amt}`).join('\n')}

Budget Analysis:
${budgetAnalysis.map(b => `- ${b.category}: Spent ₹${b.spent} of ₹${b.budget} (${b.percentage}%)`).join('\n')}

Provide concise, actionable insights. Be friendly and encouraging. Use emojis where appropriate.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'AI credits exhausted. Please add funds.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, 'Content-Type': 'text/event-stream' },
    });

  } catch (error) {
    console.error('Finance chat error:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});