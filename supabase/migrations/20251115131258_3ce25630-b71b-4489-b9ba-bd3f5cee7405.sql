-- Fix function search paths to resolve security warnings

-- Update calculate_rent_expiration function with proper search_path
CREATE OR REPLACE FUNCTION public.calculate_rent_expiration()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.rent_expiration_date := NEW.first_payment_date + (NEW.lease_duration_months || ' months')::INTERVAL;
  RETURN NEW;
END;
$$;

-- Update update_expired_leases function with proper search_path  
CREATE OR REPLACE FUNCTION public.update_expired_leases()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.rental_leases
  SET status = 'expired'
  WHERE status = 'active'
    AND rent_expiration_date < CURRENT_DATE;
  
  UPDATE public.properties
  SET status = 'available'
  WHERE id IN (
    SELECT property_id
    FROM public.rental_leases
    WHERE status = 'expired'
  );
END;
$$;