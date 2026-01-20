-- Create storage buckets for service provider and vendor profile images
INSERT INTO storage.buckets (id, name, public)
VALUES 
  ('service-provider-profiles', 'service-provider-profiles', true),
  ('vendor-profiles', 'vendor-profiles', true);

-- Add profile image URL columns to both tables
ALTER TABLE public.service_provider_registrations
ADD COLUMN profile_image_url TEXT;

ALTER TABLE public.vendor_registrations
ADD COLUMN profile_image_url TEXT;

-- Create RLS policies for service provider profile images
CREATE POLICY "Anyone can view service provider profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'service-provider-profiles');

CREATE POLICY "Service providers can upload their profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'service-provider-profiles' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Service providers can update their profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'service-provider-profiles' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Service providers can delete their profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'service-provider-profiles' AND
  auth.uid() IS NOT NULL
);

-- Create RLS policies for vendor profile images
CREATE POLICY "Anyone can view vendor profile images"
ON storage.objects FOR SELECT
USING (bucket_id = 'vendor-profiles');

CREATE POLICY "Vendors can upload their profile images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-profiles' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Vendors can update their profile images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'vendor-profiles' AND
  auth.uid() IS NOT NULL
);

CREATE POLICY "Vendors can delete their profile images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vendor-profiles' AND
  auth.uid() IS NOT NULL
);