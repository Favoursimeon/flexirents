-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  property_type TEXT NOT NULL,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('rent', 'sale')),
  price DECIMAL(10, 2) NOT NULL,
  bedrooms INTEGER,
  bathrooms DECIMAL(3, 1),
  sqft INTEGER,
  location TEXT NOT NULL,
  region TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  features JSONB DEFAULT '{"descriptions": [], "amenities": [], "facilities": []}',
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'rented', 'sold', 'pending')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create rental_leases table
CREATE TABLE public.rental_leases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  landlord_id UUID NOT NULL,
  monthly_rent DECIMAL(10, 2) NOT NULL,
  lease_duration_months INTEGER NOT NULL,
  first_payment_date DATE NOT NULL,
  lease_start_date DATE NOT NULL,
  rent_expiration_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'terminated', 'pending')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_leases ENABLE ROW LEVEL SECURITY;

-- Properties RLS Policies
CREATE POLICY "Anyone can view available properties"
ON public.properties
FOR SELECT
USING (status = 'available' OR status = 'pending');

CREATE POLICY "Property owners can view their own properties"
ON public.properties
FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Authenticated users can create properties"
ON public.properties
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Property owners can update their properties"
ON public.properties
FOR UPDATE
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Property owners can delete their properties"
ON public.properties
FOR DELETE
USING (auth.uid() = owner_id);

-- Rental Leases RLS Policies
CREATE POLICY "Tenants can view their leases"
ON public.rental_leases
FOR SELECT
USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can view their property leases"
ON public.rental_leases
FOR SELECT
USING (auth.uid() = landlord_id);

CREATE POLICY "Landlords can create leases"
ON public.rental_leases
FOR INSERT
WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Landlords can update their leases"
ON public.rental_leases
FOR UPDATE
USING (auth.uid() = landlord_id)
WITH CHECK (auth.uid() = landlord_id);

CREATE POLICY "Tenants can view lease status"
ON public.rental_leases
FOR UPDATE
USING (auth.uid() = tenant_id)
WITH CHECK (auth.uid() = tenant_id);

-- Function to calculate rent expiration date
CREATE OR REPLACE FUNCTION public.calculate_rent_expiration()
RETURNS TRIGGER AS $$
BEGIN
  NEW.rent_expiration_date := NEW.first_payment_date + (NEW.lease_duration_months || ' months')::INTERVAL;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-calculate rent expiration
CREATE TRIGGER set_rent_expiration
BEFORE INSERT OR UPDATE OF first_payment_date, lease_duration_months
ON public.rental_leases
FOR EACH ROW
EXECUTE FUNCTION public.calculate_rent_expiration();

-- Trigger for updated_at on properties
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger for updated_at on rental_leases
CREATE TRIGGER update_rental_leases_updated_at
BEFORE UPDATE ON public.rental_leases
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to check and update expired leases
CREATE OR REPLACE FUNCTION public.update_expired_leases()
RETURNS void AS $$
BEGIN
  UPDATE public.rental_leases
  SET status = 'expired'
  WHERE status = 'active'
    AND rent_expiration_date < CURRENT_DATE;
  
  UPDATE public.properties
  SET status = 'available'
  WHERE id IN (
    SELECT property_id
    FROM public.rental_leases
    WHERE status = 'expired'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create storage bucket for property images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for property images
CREATE POLICY "Anyone can view property images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'property-images');

CREATE POLICY "Authenticated users can upload property images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'property-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can update their property images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'property-images' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their property images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'property-images' 
  AND auth.uid() IS NOT NULL
);