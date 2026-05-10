
-- Add new columns for the full risk scoring framework
ALTER TABLE public.financial_assessments 
  ADD COLUMN IF NOT EXISTS income_category text DEFAULT 'irregular',
  ADD COLUMN IF NOT EXISTS previous_flexirent_repayment boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS guarantor_credibility text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS mobile_money_consistency boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS rent_dispute_history boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS social_support_type text DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS rent_burden_score numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS social_support_score numeric DEFAULT 0;

-- Create score history table for tracking score over time
CREATE TABLE public.flexi_score_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  total_score numeric NOT NULL DEFAULT 0,
  income_stability_score numeric DEFAULT 0,
  payment_behaviour_score numeric DEFAULT 0,
  rent_burden_score numeric DEFAULT 0,
  social_support_score numeric DEFAULT 0,
  tier text DEFAULT 'D',
  recorded_at timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.flexi_score_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own score history" ON public.flexi_score_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own score history" ON public.flexi_score_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can manage all score history" ON public.flexi_score_history
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable realtime for score history
ALTER PUBLICATION supabase_realtime ADD TABLE public.flexi_score_history;
