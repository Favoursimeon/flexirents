-- Create booking requests table for custom time slot requests
CREATE TABLE IF NOT EXISTS public.booking_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  provider_id UUID NOT NULL REFERENCES public.service_provider_registrations(id) ON DELETE CASCADE,
  service_type TEXT NOT NULL,
  requested_date DATE NOT NULL,
  requested_time TIME NOT NULL,
  requested_hours INTEGER NOT NULL DEFAULT 1,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined')),
  provider_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT requested_hours_positive CHECK (requested_hours > 0)
);

-- Enable RLS
ALTER TABLE public.booking_requests ENABLE ROW LEVEL SECURITY;

-- Users can view their own requests
CREATE POLICY "Users can view their own booking requests"
  ON public.booking_requests
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create booking requests
CREATE POLICY "Users can create booking requests"
  ON public.booking_requests
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Service providers can view requests for their services
CREATE POLICY "Service providers can view their booking requests"
  ON public.booking_requests
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.service_provider_registrations
      WHERE id = booking_requests.provider_id
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Service providers can update their booking requests
CREATE POLICY "Service providers can update their booking requests"
  ON public.booking_requests
  FOR UPDATE
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.service_provider_registrations
      WHERE id = booking_requests.provider_id
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.service_provider_registrations
      WHERE id = booking_requests.provider_id
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_booking_requests_updated_at
  BEFORE UPDATE ON public.booking_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create indexes for faster queries
CREATE INDEX idx_booking_requests_user_id ON public.booking_requests(user_id);
CREATE INDEX idx_booking_requests_provider_id ON public.booking_requests(provider_id);
CREATE INDEX idx_booking_requests_status ON public.booking_requests(status);