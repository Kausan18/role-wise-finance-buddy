// @ts-nocheck
// deno-lint-ignore-file no-explicit-any
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

    // Fetch user's profile (for demographic/tone tuning)
    let profile: any = null;
    try {
      const { data: profileRows } = await supabase
        .from('profiles')
        .select('name, role')
        .eq('id', userId)
        .limit(1);
      profile = Array.isArray(profileRows) ? profileRows[0] : profileRows;
    } catch (err) {
      console.warn('Failed to fetch profile for tone tuning:', err);
      profile = null;
    }

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

    // Tune tone based on profile.role (student | professional | family)
    const role = profile?.role;
    const name = profile?.name || '';
    const firstName = name ? name.split(' ')[0] : '';
    let tone = 'friendly and encouraging';
    if (role === 'student') tone = 'casual, encouraging, and explanatory (use simple language)';
    else if (role === 'professional') tone = 'concise, formal, and data-driven';
    else if (role === 'family') tone = 'warm, empathetic, and supportive';

    const systemPrompt = `You are a personal finance assistant. Analyze the user's financial data and provide helpful insights.

User profile:
- Name: ${name || 'Unknown'}
- Role: ${role || 'unspecified'}

Tone instructions: Address the user${firstName ? ` as ${firstName}` : ''}. Use a ${tone} tone.

Current Month Data:
- Total Spending: ₹${currentMonthSpending}
- Previous Month Spending: ₹${previousMonthSpending}
- Spending Change: ${spendingIncrease}%

Category Spending (Current Month):
${Object.entries(categorySpending).map(([cat, amt]) => `- ${cat}: ₹${amt}`).join('\n')}

Budget Analysis:
${budgetAnalysis.map(b => `- ${b.category}: Spent ₹${b.spent} of ₹${b.budget} (${b.percentage}%)`).join('\n')}

Provide concise, actionable insights. Be helpful, use emojis where appropriate, and adapt recommendations to the user's role.`;

    // Configure AI service endpoint
    const AI_SERVICE_URL = Deno.env.get('AI_SERVICE_URL') || 'http://localhost:8000';
    
    let aiRequestUrl: string;
    let aiRequestOptions: RequestInit;
    let useLocalAI = true;

    try {
      // Try Python AI service first
      aiRequestUrl = `${AI_SERVICE_URL}/v1/chat/completions`;
      aiRequestOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            ...messages
          ],
          stream: true,
        }),
      };

      // Quick check if service is available
      const healthCheck = await fetch(`${AI_SERVICE_URL}/health`);
      if (!healthCheck.ok) {
        throw new Error('Local AI service unavailable');
      }
    } catch (err) {
      // Fallback to Lovable gateway
      console.warn('Local AI service error, falling back to Lovable:', err);
      useLocalAI = false;
      aiRequestUrl = 'https://ai.gateway.lovable.dev/v1/chat/completions';
      aiRequestOptions = {
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
      };
    }

    const response = await fetch(aiRequestUrl, aiRequestOptions);

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