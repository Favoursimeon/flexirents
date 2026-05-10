-- Create document_versions table to store version history
CREATE TABLE public.document_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  notes TEXT,
  is_current BOOLEAN NOT NULL DEFAULT false
);

-- Enable RLS
ALTER TABLE public.document_versions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view versions of their own documents
CREATE POLICY "Users can view versions of their own documents"
ON public.document_versions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE id = document_versions.document_id AND owner_id = auth.uid()
  )
);

-- Policy: Users can create versions for their own documents
CREATE POLICY "Users can create versions for their documents"
ON public.document_versions
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE id = document_versions.document_id AND owner_id = auth.uid()
  )
);

-- Policy: Users can delete versions of their own documents
CREATE POLICY "Users can delete versions of their documents"
ON public.document_versions
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE id = document_versions.document_id AND owner_id = auth.uid()
  )
);

-- Policy: Admins can manage all versions
CREATE POLICY "Admins can manage all document versions"
ON public.document_versions
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes
CREATE INDEX idx_document_versions_document ON public.document_versions(document_id);
CREATE INDEX idx_document_versions_current ON public.document_versions(document_id, is_current) WHERE is_current = true;