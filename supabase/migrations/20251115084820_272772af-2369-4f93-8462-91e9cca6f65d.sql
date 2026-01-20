-- Add RLS policies for service providers to view and manage their bookings

-- Allow service providers to view bookings where they are the assigned provider
CREATE POLICY "Service providers can view their bookings"
ON public.bookings FOR SELECT
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.service_provider_registrations
    WHERE service_provider_registrations.id = bookings.service_provider_id
    AND service_provider_registrations.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);

-- Allow service providers to update the status of their bookings
CREATE POLICY "Service providers can update their bookings"
ON public.bookings FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.service_provider_registrations
    WHERE service_provider_registrations.id = bookings.service_provider_id
    AND service_provider_registrations.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM public.service_provider_registrations
    WHERE service_provider_registrations.id = bookings.service_provider_id
    AND service_provider_registrations.email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
);