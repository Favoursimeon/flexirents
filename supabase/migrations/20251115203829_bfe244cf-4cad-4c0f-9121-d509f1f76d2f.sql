-- Create portfolio_images table for service providers
CREATE TABLE public.portfolio_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  category TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT fk_provider 
    FOREIGN KEY (provider_id) 
    REFERENCES public.service_provider_registrations(id) 
    ON DELETE CASCADE
);

-- Enable RLS
ALTER TABLE public.portfolio_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view portfolio images of approved providers
CREATE POLICY "Anyone can view portfolio images" 
ON public.portfolio_images 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM service_provider_registrations
    WHERE service_provider_registrations.id = portfolio_images.provider_id
      AND service_provider_registrations.status = 'approved'
  )
);

-- Service providers can manage their own portfolio images
CREATE POLICY "Service providers can manage their portfolio" 
ON public.portfolio_images 
FOR ALL 
USING (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1
    FROM service_provider_registrations
    WHERE service_provider_registrations.id = portfolio_images.provider_id
      AND service_provider_registrations.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
  )
)
WITH CHECK (
  auth.uid() IS NOT NULL 
  AND EXISTS (
    SELECT 1
    FROM service_provider_registrations
    WHERE service_provider_registrations.id = portfolio_images.provider_id
      AND service_provider_registrations.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
  )
);

-- Create storage bucket for portfolio images
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio-images', 'portfolio-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for portfolio images
CREATE POLICY "Anyone can view portfolio images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'portfolio-images');

CREATE POLICY "Service providers can upload portfolio images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'portfolio-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Service providers can update their portfolio images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'portfolio-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Service providers can delete their portfolio images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'portfolio-images' 
  AND auth.uid() IS NOT NULL
);

-- Trigger to update updated_at
CREATE TRIGGER update_portfolio_images_updated_at
BEFORE UPDATE ON public.portfolio_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();