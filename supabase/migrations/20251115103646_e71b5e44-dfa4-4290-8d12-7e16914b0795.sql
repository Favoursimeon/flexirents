-- Allow service providers to update their own registration details
CREATE POLICY "Service providers can update their own details"
ON public.service_provider_registrations
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND 
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
)
WITH CHECK (
  auth.uid() IS NOT NULL AND 
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);