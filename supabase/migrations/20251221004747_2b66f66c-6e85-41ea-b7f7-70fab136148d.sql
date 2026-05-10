-- Create documents table for storing document metadata
CREATE TABLE public.documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  lease_id UUID REFERENCES public.rental_leases(id) ON DELETE SET NULL,
  document_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  description TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Create storage bucket for documents (private)
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false);

-- RLS Policies for documents table
CREATE POLICY "Users can view their own documents"
ON public.documents FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Landlords can view documents for their properties"
ON public.documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = documents.property_id
    AND properties.owner_id = auth.uid()
  )
);

CREATE POLICY "Tenants can view documents for their leases"
ON public.documents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.rental_leases
    WHERE rental_leases.id = documents.lease_id
    AND rental_leases.tenant_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all documents"
ON public.documents FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can upload their own documents"
ON public.documents FOR INSERT
WITH CHECK (auth.uid() = owner_id AND auth.uid() = uploaded_by);

CREATE POLICY "Users can update their own documents"
ON public.documents FOR UPDATE
USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete their own documents"
ON public.documents FOR DELETE
USING (auth.uid() = owner_id);

CREATE POLICY "Admins can manage all documents"
ON public.documents FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage policies for documents bucket
CREATE POLICY "Users can upload to their own folder"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Landlords can view tenant documents for their properties"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  EXISTS (
    SELECT 1 FROM public.documents d
    JOIN public.properties p ON d.property_id = p.id
    WHERE p.owner_id = auth.uid()
    AND d.file_url LIKE '%' || name
  )
);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (bucket_id = 'documents' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Update trigger for documents
CREATE TRIGGER update_documents_updated_at
BEFORE UPDATE ON public.documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();