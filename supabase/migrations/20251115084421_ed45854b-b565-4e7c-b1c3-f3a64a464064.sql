-- Fix Security Definer Views
-- Recreate views with SECURITY INVOKER to enforce querying user's permissions

-- Drop and recreate public_profiles view
DROP VIEW IF EXISTS public.public_profiles;
CREATE VIEW public.public_profiles 
WITH (security_invoker = true)
AS
SELECT id, full_name, avatar_url, created_at
FROM public.profiles;

-- Drop and recreate approved_service_providers view
DROP VIEW IF EXISTS public.approved_service_providers;
CREATE VIEW public.approved_service_providers 
WITH (security_invoker = true)
AS
SELECT 
  id, 
  provider_name, 
  service_category, 
  region, 
  location, 
  description, 
  hourly_rate, 
  years_experience, 
  availability,
  created_at
FROM public.service_provider_registrations
WHERE status = 'approved';

-- Drop and recreate approved_vendors view
DROP VIEW IF EXISTS public.approved_vendors;
CREATE VIEW public.approved_vendors 
WITH (security_invoker = true)
AS
SELECT 
  id, 
  business_name, 
  business_category, 
  region, 
  location,
  description, 
  website,
  created_at
FROM public.vendor_registrations
WHERE status = 'approved';