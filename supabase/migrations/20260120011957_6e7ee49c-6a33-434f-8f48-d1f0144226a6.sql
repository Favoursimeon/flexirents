-- Add lease_duration column to properties table for rental listings
ALTER TABLE public.properties 
ADD COLUMN lease_duration_months integer[] DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.properties.lease_duration_months IS 'Available lease durations in months (e.g., [6, 12, 24]) for rental properties';