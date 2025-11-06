-- Add monthly_income field to profiles table
ALTER TABLE public.profiles
ADD COLUMN monthly_income numeric DEFAULT 0;

-- Create function to calculate and update finance score
CREATE OR REPLACE FUNCTION public.calculate_finance_score(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_score integer := 500;
  v_income numeric;
  v_total_expenses numeric;
  v_total_budgets numeric;
  v_savings_rate numeric;
  v_budget_adherence numeric;
  v_health_label text;
BEGIN
  -- Get user's income
  SELECT monthly_income INTO v_income
  FROM profiles
  WHERE id = p_user_id;

  -- Calculate current month's expenses
  SELECT COALESCE(SUM(amount), 0) INTO v_total_expenses
  FROM transactions
  WHERE user_id = p_user_id
    AND type = 'expense'
    AND date >= date_trunc('month', CURRENT_DATE);

  -- Calculate total budgets for current month
  SELECT COALESCE(SUM(amount), 0) INTO v_total_budgets
  FROM budgets
  WHERE user_id = p_user_id
    AND month >= date_trunc('month', CURRENT_DATE);

  -- Calculate savings rate (if income > 0)
  IF v_income > 0 THEN
    v_savings_rate := ((v_income - v_total_expenses) / v_income) * 100;
    
    -- Score based on savings rate
    IF v_savings_rate >= 30 THEN
      v_score := v_score + 150;
    ELSIF v_savings_rate >= 20 THEN
      v_score := v_score + 100;
    ELSIF v_savings_rate >= 10 THEN
      v_score := v_score + 50;
    ELSIF v_savings_rate < 0 THEN
      v_score := v_score - 100;
    END IF;

    -- Score based on budget adherence
    IF v_total_budgets > 0 THEN
      v_budget_adherence := (v_total_expenses / v_total_budgets) * 100;
      
      IF v_budget_adherence <= 80 THEN
        v_score := v_score + 100;
      ELSIF v_budget_adherence <= 100 THEN
        v_score := v_score + 50;
      ELSIF v_budget_adherence > 120 THEN
        v_score := v_score - 100;
      END IF;
    END IF;

    -- Penalty for spending more than income
    IF v_total_expenses > v_income THEN
      v_score := v_score - 150;
    END IF;
  END IF;

  -- Ensure score is within bounds
  v_score := GREATEST(300, LEAST(850, v_score));

  -- Determine health label
  IF v_score >= 750 THEN
    v_health_label := 'Excellent';
  ELSIF v_score >= 650 THEN
    v_health_label := 'Good';
  ELSIF v_score >= 550 THEN
    v_health_label := 'Average';
  ELSIF v_score >= 450 THEN
    v_health_label := 'Fair';
  ELSE
    v_health_label := 'Poor';
  END IF;

  -- Update or insert finance score
  INSERT INTO finance_scores (user_id, score, health_label, last_calculated)
  VALUES (p_user_id, v_score, v_health_label, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    score = v_score,
    health_label = v_health_label,
    last_calculated = now();
END;
$$;

-- Create trigger to update finance score when transactions change
CREATE OR REPLACE FUNCTION public.update_finance_score_on_transaction()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM calculate_finance_score(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_transaction_change ON public.transactions;
CREATE TRIGGER on_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_finance_score_on_transaction();

-- Create trigger to update finance score when budgets change
CREATE OR REPLACE FUNCTION public.update_finance_score_on_budget()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM calculate_finance_score(COALESCE(NEW.user_id, OLD.user_id));
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS on_budget_change ON public.budgets;
CREATE TRIGGER on_budget_change
  AFTER INSERT OR UPDATE OR DELETE ON public.budgets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_finance_score_on_budget();