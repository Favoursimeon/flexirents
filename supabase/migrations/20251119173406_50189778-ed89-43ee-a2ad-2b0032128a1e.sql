-- Add locations column to user_preferences table
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS locations text[] DEFAULT '{}'::text[];