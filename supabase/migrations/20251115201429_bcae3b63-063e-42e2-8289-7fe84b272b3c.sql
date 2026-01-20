-- Create security definer function to safely check email ownership
CREATE OR REPLACE FUNCTION public.is_user_email(_email text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE id = auth.uid()
      AND email = _email
  )
$$;

-- Update vendor_registrations policies to use the security definer function
DROP POLICY IF EXISTS "Vendors can update their own registration" ON public.vendor_registrations;
CREATE POLICY "Vendors can update their own registration"
ON public.vendor_registrations
FOR UPDATE
USING (auth.uid() IS NOT NULL AND public.is_user_email(email))
WITH CHECK (auth.uid() IS NOT NULL AND public.is_user_email(email));

DROP POLICY IF EXISTS "Vendors can view their own registration" ON public.vendor_registrations;
CREATE POLICY "Vendors can view their own registration"
ON public.vendor_registrations
FOR SELECT
USING (auth.uid() IS NOT NULL AND public.is_user_email(email));

-- Update service_provider_registrations policies to use the security definer function
DROP POLICY IF EXISTS "Service providers can update their own details" ON public.service_provider_registrations;
CREATE POLICY "Service providers can update their own details"
ON public.service_provider_registrations
FOR UPDATE
USING (auth.uid() IS NOT NULL AND public.is_user_email(email))
WITH CHECK (auth.uid() IS NOT NULL AND public.is_user_email(email));