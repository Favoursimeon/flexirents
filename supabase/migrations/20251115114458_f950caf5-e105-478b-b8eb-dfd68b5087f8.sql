-- Create storage bucket for vendor products
INSERT INTO storage.buckets (id, name, public)
VALUES ('vendor-products', 'vendor-products', true);

-- Storage RLS policies for vendor products
CREATE POLICY "Anyone can view vendor product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'vendor-products');

CREATE POLICY "Vendors can upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-products' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Vendors can update their product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-products' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

CREATE POLICY "Vendors can delete their product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-products' AND
  (auth.uid())::text = (storage.foldername(name))[1]
);

-- Create vendor_products table
CREATE TABLE public.vendor_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendor_registrations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  price TEXT,
  category TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  is_featured BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.vendor_products ENABLE ROW LEVEL SECURITY;

-- RLS policies for vendor_products
CREATE POLICY "Anyone can view approved vendor products"
ON public.vendor_products
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.vendor_registrations
    WHERE id = vendor_products.vendor_id
    AND status = 'approved'
  )
);

CREATE POLICY "Vendors can insert their own products"
ON public.vendor_products
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.vendor_registrations
    WHERE id = vendor_products.vendor_id
    AND email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text
    AND status = 'approved'
  )
);

CREATE POLICY "Vendors can update their own products"
ON public.vendor_products
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vendor_registrations
    WHERE id = vendor_products.vendor_id
    AND email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text
  )
);

CREATE POLICY "Vendors can delete their own products"
ON public.vendor_products
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.vendor_registrations
    WHERE id = vendor_products.vendor_id
    AND email = (SELECT users.email FROM auth.users WHERE users.id = auth.uid())::text
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_vendor_products_updated_at
BEFORE UPDATE ON public.vendor_products
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();