-- Create a table to track page visits
CREATE TABLE public.page_visits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  user_id UUID,
  device_type TEXT,
  source TEXT DEFAULT 'direct',
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.page_visits ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting visits (anyone can insert)
CREATE POLICY "Anyone can insert page visits"
ON public.page_visits
FOR INSERT
WITH CHECK (true);

-- Create policy for reading visits (admins only)
CREATE POLICY "Admins can view all page visits"
ON public.page_visits
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create policy for updating visits (to set ended_at)
CREATE POLICY "Anyone can update their own session"
ON public.page_visits
FOR UPDATE
USING (true);

-- Enable realtime for the table
ALTER PUBLICATION supabase_realtime ADD TABLE public.page_visits;