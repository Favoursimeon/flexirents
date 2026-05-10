
-- Financial assessments table for Flexi-Instalment Gauge (FIG)
CREATE TABLE public.financial_assessments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  
  -- Income data
  monthly_net_income NUMERIC DEFAULT 0,
  income_source TEXT DEFAULT 'salary', -- salary, contract, business, informal
  employer_tier TEXT DEFAULT 'sme', -- govt_tier1, sme, contract, self_employed, informal
  employment_duration_months INTEGER DEFAULT 0,
  
  -- Rent affordability
  target_rent NUMERIC DEFAULT 0,
  
  -- Payment behaviour
  payment_behaviour TEXT DEFAULT 'clean', -- clean, minor_volatility, frequent_issues
  has_prior_flexirent_history BOOLEAN DEFAULT false,
  
  -- Verification strength
  gov_id_verified BOOLEAN DEFAULT false,
  bank_verified BOOLEAN DEFAULT false,
  employment_verified BOOLEAN DEFAULT false,
  
  -- Scoring results (auto-calculated)
  income_score NUMERIC DEFAULT 0,
  affordability_score NUMERIC DEFAULT 0,
  employment_score NUMERIC DEFAULT 0,
  behaviour_score NUMERIC DEFAULT 0,
  verification_score NUMERIC DEFAULT 0,
  total_score NUMERIC DEFAULT 0,
  tier TEXT DEFAULT 'D', -- A, B, C, D
  
  -- Admin override
  is_overridden BOOLEAN DEFAULT false,
  override_tier TEXT,
  override_reason TEXT,
  overridden_by UUID,
  overridden_at TIMESTAMP WITH TIME ZONE,
  
  -- Metadata
  score_frozen BOOLEAN DEFAULT false,
  frozen_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.financial_assessments ENABLE ROW LEVEL SECURITY;

-- Admin policies
CREATE POLICY "Admins can manage all financial assessments"
ON public.financial_assessments FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- User policies
CREATE POLICY "Users can view own financial assessment"
ON public.financial_assessments FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own financial assessment"
ON public.financial_assessments FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own financial assessment"
ON public.financial_assessments FOR UPDATE
USING (auth.uid() = user_id AND score_frozen = false);
