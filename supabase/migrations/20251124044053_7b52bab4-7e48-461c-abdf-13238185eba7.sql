-- Add foreign key constraint from booking_requests to profiles
ALTER TABLE public.booking_requests
ADD CONSTRAINT booking_requests_user_id_fkey
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;