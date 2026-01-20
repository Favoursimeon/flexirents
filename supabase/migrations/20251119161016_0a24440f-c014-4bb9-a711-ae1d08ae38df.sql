-- Create rental_payments table for tracking installment payments
CREATE TABLE IF NOT EXISTS public.rental_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lease_id UUID NOT NULL REFERENCES public.rental_leases(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  landlord_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  payment_date DATE,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  verification_status TEXT NOT NULL DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'unverified', 'pending')),
  payment_method TEXT,
  transaction_reference TEXT,
  notes TEXT,
  receipt_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rental_payments ENABLE ROW LEVEL SECURITY;

-- Tenants can view their own payments
CREATE POLICY "Tenants can view their payments"
  ON public.rental_payments
  FOR SELECT
  USING (auth.uid() = tenant_id);

-- Landlords can view payments for their properties
CREATE POLICY "Landlords can view their rental payments"
  ON public.rental_payments
  FOR SELECT
  USING (auth.uid() = landlord_id);

-- Landlords can create payment records
CREATE POLICY "Landlords can create payment records"
  ON public.rental_payments
  FOR INSERT
  WITH CHECK (auth.uid() = landlord_id);

-- Landlords can update payment records
CREATE POLICY "Landlords can update payment records"
  ON public.rental_payments
  FOR UPDATE
  USING (auth.uid() = landlord_id)
  WITH CHECK (auth.uid() = landlord_id);

-- Tenants can update their payment information
CREATE POLICY "Tenants can update payment info"
  ON public.rental_payments
  FOR UPDATE
  USING (auth.uid() = tenant_id)
  WITH CHECK (auth.uid() = tenant_id);

-- Admins can manage all payments
CREATE POLICY "Admins can manage all payments"
  ON public.rental_payments
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for faster queries
CREATE INDEX idx_rental_payments_tenant ON public.rental_payments(tenant_id);
CREATE INDEX idx_rental_payments_lease ON public.rental_payments(lease_id);
CREATE INDEX idx_rental_payments_due_date ON public.rental_payments(due_date);
CREATE INDEX idx_rental_payments_status ON public.rental_payments(status);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_rental_payments_updated_at
  BEFORE UPDATE ON public.rental_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();