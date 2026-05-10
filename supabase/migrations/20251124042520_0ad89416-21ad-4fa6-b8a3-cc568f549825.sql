-- Add admin policy to view all booking requests
CREATE POLICY "Admins can view all booking requests"
ON public.booking_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy to update all booking requests
CREATE POLICY "Admins can update all booking requests"
ON public.booking_requests
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));