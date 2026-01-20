-- Create currency_rates table for admin-managed exchange rates
CREATE TABLE IF NOT EXISTS public.currency_rates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  currency_code TEXT NOT NULL UNIQUE,
  currency_name TEXT NOT NULL,
  currency_symbol TEXT NOT NULL,
  rate_to_usd NUMERIC(10, 4) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.currency_rates ENABLE ROW LEVEL SECURITY;

-- Everyone can read currency rates
CREATE POLICY "Anyone can view currency rates"
ON public.currency_rates
FOR SELECT
USING (true);

-- Only admins can manage currency rates
CREATE POLICY "Admins can insert currency rates"
ON public.currency_rates
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can update currency rates"
ON public.currency_rates
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete currency rates"
ON public.currency_rates
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- Insert default currency rates
INSERT INTO public.currency_rates (currency_code, currency_name, currency_symbol, rate_to_usd) VALUES
  ('USD', 'US Dollar', '$', 1.0000),
  ('GHS', 'Ghanaian Cedi', '₵', 12.5000),
  ('EUR', 'Euro', '€', 0.9200),
  ('GBP', 'British Pound', '£', 0.7900),
  ('NGN', 'Nigerian Naira', '₦', 1580.0000)
ON CONFLICT (currency_code) DO NOTHING;

-- Create trigger to update timestamp
CREATE OR REPLACE FUNCTION update_currency_rates_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER currency_rates_updated_at
BEFORE UPDATE ON public.currency_rates
FOR EACH ROW
EXECUTE FUNCTION update_currency_rates_updated_at();