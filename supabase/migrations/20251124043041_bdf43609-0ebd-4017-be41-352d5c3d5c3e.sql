-- Fix booking_requests policies to avoid direct auth.users access and allow admins

ALTER POLICY "Service providers can view their booking requests"
ON public.booking_requests
USING (
  (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM service_provider_registrations
      WHERE service_provider_registrations.id = booking_requests.provider_id
        AND is_user_email(service_provider_registrations.email)
    )
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

ALTER POLICY "Service providers can update their booking requests"
ON public.booking_requests
USING (
  (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM service_provider_registrations
      WHERE service_provider_registrations.id = booking_requests.provider_id
        AND is_user_email(service_provider_registrations.email)
    )
  )
  OR has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  (
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM service_provider_registrations
      WHERE service_provider_registrations.id = booking_requests.provider_id
        AND is_user_email(service_provider_registrations.email)
    )
  )
  OR has_role(auth.uid(), 'admin'::app_role)
);

ALTER POLICY "Users can view their own booking requests"
ON public.booking_requests
USING (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
);

ALTER POLICY "Users can create booking requests"
ON public.booking_requests
WITH CHECK (
  auth.uid() = user_id
  OR has_role(auth.uid(), 'admin'::app_role)
);