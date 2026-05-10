-- Create viewing_schedules table
CREATE TABLE public.viewing_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  scheduled_date DATE NOT NULL,
  scheduled_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'completed')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.viewing_schedules ENABLE ROW LEVEL SECURITY;

-- RLS Policies for viewing_schedules
CREATE POLICY "Users can create their own viewing schedules"
ON public.viewing_schedules
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own viewing schedules"
ON public.viewing_schedules
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Property owners can view schedules for their properties"
ON public.viewing_schedules
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = viewing_schedules.property_id
    AND properties.owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own viewing schedules"
ON public.viewing_schedules
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Property owners can update schedules for their properties"
ON public.viewing_schedules
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = viewing_schedules.property_id
    AND properties.owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can manage all viewing schedules"
ON public.viewing_schedules
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for better query performance
CREATE INDEX idx_viewing_schedules_property_id ON public.viewing_schedules(property_id);
CREATE INDEX idx_viewing_schedules_user_id ON public.viewing_schedules(user_id);
CREATE INDEX idx_viewing_schedules_date ON public.viewing_schedules(scheduled_date);

-- Add trigger for updated_at
CREATE TRIGGER update_viewing_schedules_updated_at
BEFORE UPDATE ON public.viewing_schedules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();