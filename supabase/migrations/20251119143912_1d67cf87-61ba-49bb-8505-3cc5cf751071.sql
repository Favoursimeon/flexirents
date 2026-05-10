-- Add is_enabled column to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN DEFAULT true NOT NULL;