
ALTER TABLE public.financial_assessments 
  ADD COLUMN IF NOT EXISTS guarantor_evidence_url text,
  ADD COLUMN IF NOT EXISTS bank_statement_url text,
  ADD COLUMN IF NOT EXISTS social_support_evidence_url text;
