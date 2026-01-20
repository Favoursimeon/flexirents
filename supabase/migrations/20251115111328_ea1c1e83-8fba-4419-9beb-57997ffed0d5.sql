-- Create availability slots table for service providers
CREATE TABLE IF NOT EXISTS public.provider_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.service_provider_registrations(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(provider_id, date, start_time)
);

-- Enable RLS
ALTER TABLE public.provider_availability ENABLE ROW LEVEL SECURITY;

-- Public can view availability
CREATE POLICY "Anyone can view availability"
  ON public.provider_availability
  FOR SELECT
  USING (true);

-- Service providers can manage their own availability
CREATE POLICY "Service providers can manage their availability"
  ON public.provider_availability
  FOR ALL
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.service_provider_registrations
      WHERE id = provider_availability.provider_id
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  )
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM public.service_provider_registrations
      WHERE id = provider_availability.provider_id
      AND email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_provider_availability_updated_at
  BEFORE UPDATE ON public.provider_availability
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster queries
CREATE INDEX idx_provider_availability_provider_date 
  ON public.provider_availability(provider_id, date);