
-- Create table for user payment accounts (bank accounts for standing orders)
CREATE TABLE public.payment_accounts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  account_name VARCHAR(255) NOT NULL,
  bank_name VARCHAR(255) NOT NULL,
  account_number VARCHAR(20) NOT NULL,
  account_type VARCHAR(50) DEFAULT 'savings',
  is_primary BOOLEAN DEFAULT false,
  is_verified BOOLEAN DEFAULT false,
  paystack_recipient_code VARCHAR(100),
  paystack_authorization_code VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for recurring payment schedules
CREATE TABLE public.recurring_payment_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  lease_id UUID REFERENCES public.rental_leases(id),
  payment_account_id UUID REFERENCES public.payment_accounts(id),
  amount NUMERIC NOT NULL,
  frequency VARCHAR(50) DEFAULT 'monthly',
  day_of_month INTEGER DEFAULT 1,
  start_date DATE NOT NULL,
  end_date DATE,
  next_payment_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'active',
  last_payment_date DATE,
  last_payment_status VARCHAR(50),
  total_payments_made INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recurring_payment_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies for payment_accounts
CREATE POLICY "Users can view their own payment accounts"
  ON public.payment_accounts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own payment accounts"
  ON public.payment_accounts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own payment accounts"
  ON public.payment_accounts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own payment accounts"
  ON public.payment_accounts FOR DELETE
  USING (auth.uid() = user_id);

-- RLS policies for recurring_payment_schedules
CREATE POLICY "Users can view their own recurring schedules"
  ON public.recurring_payment_schedules FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own recurring schedules"
  ON public.recurring_payment_schedules FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own recurring schedules"
  ON public.recurring_payment_schedules FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own recurring schedules"
  ON public.recurring_payment_schedules FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_payment_accounts_updated_at
  BEFORE UPDATE ON public.payment_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_recurring_schedules_updated_at
  BEFORE UPDATE ON public.recurring_payment_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
