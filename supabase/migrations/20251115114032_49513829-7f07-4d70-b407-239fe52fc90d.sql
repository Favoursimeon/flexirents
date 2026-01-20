-- Add vendor to app_role enum
ALTER TYPE public.app_role ADD VALUE 'vendor';

-- Update RLS policies for vendor_registrations to link with user roles
CREATE POLICY "Vendors can update their own registration"
ON public.vendor_registrations
FOR UPDATE
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  (email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text)
)
WITH CHECK (
  (auth.uid() IS NOT NULL) AND 
  (email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text)
);

CREATE POLICY "Vendors can view their own registration"
ON public.vendor_registrations
FOR SELECT
TO authenticated
USING (
  (auth.uid() IS NOT NULL) AND 
  (email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text)
);