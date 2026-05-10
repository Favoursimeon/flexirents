-- Create review_votes table for helpful/unhelpful votes
CREATE TABLE public.review_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  review_id UUID NOT NULL REFERENCES public.reviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('helpful', 'unhelpful')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(review_id, user_id)
);

-- Enable Row Level Security
ALTER TABLE public.review_votes ENABLE ROW LEVEL SECURITY;

-- Anyone can view votes
CREATE POLICY "Anyone can view review votes"
ON public.review_votes
FOR SELECT
USING (true);

-- Authenticated users can vote
CREATE POLICY "Authenticated users can vote"
ON public.review_votes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update their own votes"
ON public.review_votes
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete their own votes"
ON public.review_votes
FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for faster queries
CREATE INDEX idx_review_votes_review_id ON public.review_votes(review_id);
CREATE INDEX idx_review_votes_user_id ON public.review_votes(user_id);

-- Create function to update updated_at timestamp
CREATE TRIGGER update_review_votes_updated_at
  BEFORE UPDATE ON public.review_votes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();