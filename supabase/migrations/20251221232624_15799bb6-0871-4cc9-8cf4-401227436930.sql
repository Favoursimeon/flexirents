-- Create document_shares table for tracking shared documents
CREATE TABLE public.document_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  document_id UUID NOT NULL REFERENCES public.documents(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL,
  share_token UUID NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  shared_with_email TEXT,
  share_type TEXT NOT NULL DEFAULT 'link' CHECK (share_type IN ('link', 'email')),
  permission TEXT NOT NULL DEFAULT 'view' CHECK (permission IN ('view', 'download')),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  accessed_at TIMESTAMP WITH TIME ZONE,
  access_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view shares they created
CREATE POLICY "Users can view their own shares"
ON public.document_shares
FOR SELECT
USING (auth.uid() = shared_by);

-- Policy: Users can create shares for their documents
CREATE POLICY "Users can create shares for their documents"
ON public.document_shares
FOR INSERT
WITH CHECK (
  auth.uid() = shared_by AND
  EXISTS (
    SELECT 1 FROM public.documents 
    WHERE id = document_id AND owner_id = auth.uid()
  )
);

-- Policy: Users can update their own shares
CREATE POLICY "Users can update their own shares"
ON public.document_shares
FOR UPDATE
USING (auth.uid() = shared_by);

-- Policy: Users can delete their own shares
CREATE POLICY "Users can delete their own shares"
ON public.document_shares
FOR DELETE
USING (auth.uid() = shared_by);

-- Policy: Anyone can view active shares by token (for public access)
CREATE POLICY "Anyone can access shared documents via token"
ON public.document_shares
FOR SELECT
USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Create index for faster token lookups
CREATE INDEX idx_document_shares_token ON public.document_shares(share_token);
CREATE INDEX idx_document_shares_document ON public.document_shares(document_id);

-- Trigger for updated_at
CREATE TRIGGER update_document_shares_updated_at
BEFORE UPDATE ON public.document_shares
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();