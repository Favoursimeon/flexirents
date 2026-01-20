-- Create messages table for booking conversations
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  message_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  read BOOLEAN NOT NULL DEFAULT false
);

-- Enable Row Level Security
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view messages for their own bookings
CREATE POLICY "Users can view messages for their bookings"
ON public.messages
FOR SELECT
USING (
  auth.uid() IS NOT NULL AND (
    -- User is the client
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = messages.booking_id
      AND bookings.user_id = auth.uid()
    )
    OR
    -- User is the service provider
    EXISTS (
      SELECT 1 FROM public.bookings
      JOIN public.service_provider_registrations
      ON bookings.service_provider_id = service_provider_registrations.id
      WHERE bookings.id = messages.booking_id
      AND service_provider_registrations.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  )
);

-- Policy: Users can create messages for their bookings
CREATE POLICY "Users can create messages for their bookings"
ON public.messages
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL AND auth.uid() = sender_id AND (
    -- User is the client
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = messages.booking_id
      AND bookings.user_id = auth.uid()
    )
    OR
    -- User is the service provider
    EXISTS (
      SELECT 1 FROM public.bookings
      JOIN public.service_provider_registrations
      ON bookings.service_provider_id = service_provider_registrations.id
      WHERE bookings.id = messages.booking_id
      AND service_provider_registrations.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  )
);

-- Policy: Users can update read status of messages
CREATE POLICY "Users can update message read status"
ON public.messages
FOR UPDATE
USING (
  auth.uid() IS NOT NULL AND (
    -- User is the client
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = messages.booking_id
      AND bookings.user_id = auth.uid()
    )
    OR
    -- User is the service provider
    EXISTS (
      SELECT 1 FROM public.bookings
      JOIN public.service_provider_registrations
      ON bookings.service_provider_id = service_provider_registrations.id
      WHERE bookings.id = messages.booking_id
      AND service_provider_registrations.email = (
        SELECT email FROM auth.users WHERE id = auth.uid()
      )
    )
  )
);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- Create index for faster queries
CREATE INDEX idx_messages_booking_id ON public.messages(booking_id);
CREATE INDEX idx_messages_created_at ON public.messages(created_at);