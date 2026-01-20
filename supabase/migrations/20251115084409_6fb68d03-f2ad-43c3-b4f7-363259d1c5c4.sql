-- Fix Critical Data Exposure Issues

-- ============================================
-- 1. FIX PROFILES TABLE
-- ============================================
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

-- Allow users to view only their own full profile (includes phone)
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

-- Create a public view with only non-sensitive data (excludes phone)
CREATE VIEW public.public_profiles AS
SELECT id, full_name, avatar_url, created_at
FROM public.profiles;

-- ============================================
-- 2. FIX SERVICE_PROVIDER_REGISTRATIONS TABLE
-- ============================================
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.service_provider_registrations;

-- Only show approved providers to public
CREATE POLICY "Public can view approved providers"
ON public.service_provider_registrations FOR SELECT
USING (status = 'approved');

-- Create a public view that excludes sensitive contact info
CREATE VIEW public.approved_service_providers AS
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
-- Excludes: email, phone, contact_name, certifications

-- ============================================
-- 3. FIX VENDOR_REGISTRATIONS TABLE
-- ============================================
-- Drop overly permissive policy
DROP POLICY IF EXISTS "Users can view their own registrations" ON public.vendor_registrations;

-- Public can only view approved vendors
CREATE POLICY "Public can view approved vendors"
ON public.vendor_registrations FOR SELECT
USING (status = 'approved');

-- Create sanitized public view
CREATE VIEW public.approved_vendors AS
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
-- Excludes: email, phone, contact_name