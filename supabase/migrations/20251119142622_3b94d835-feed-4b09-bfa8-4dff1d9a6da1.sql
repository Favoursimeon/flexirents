-- Create user verification table
CREATE TABLE IF NOT EXISTS public.user_verification (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'not_verified',
  id_type text,
  id_number text,
  id_front_url text,
  id_back_url text,
  birth_region text,
  birth_city text,
  birth_street text,
  personal_picture_url text,
  employment_status text,
  employer_name text,
  proof_of_work_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_verification ENABLE ROW LEVEL SECURITY;

-- Users can view their own verification
CREATE POLICY "Users can view own verification"
  ON public.user_verification
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own verification
CREATE POLICY "Users can insert own verification"
  ON public.user_verification
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own verification
CREATE POLICY "Users can update own verification"
  ON public.user_verification
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all verifications
CREATE POLICY "Admins can view all verifications"
  ON public.user_verification
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update all verifications
CREATE POLICY "Admins can update all verifications"
  ON public.user_verification
  FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_user_verification_updated_at
  BEFORE UPDATE ON public.user_verification
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for verification documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('verification-documents', 'verification-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for verification documents
CREATE POLICY "Users can upload their verification documents"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their verification documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their verification documents"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their verification documents"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'verification-documents' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Admins can view all verification documents"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'verification-documents' AND
    has_role(auth.uid(), 'admin'::app_role)
  );