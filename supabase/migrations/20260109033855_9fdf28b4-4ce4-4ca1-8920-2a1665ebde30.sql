-- Create table for daily quality ratings
CREATE TABLE public.daily_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE public.daily_ratings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own daily ratings"
ON public.daily_ratings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily ratings"
ON public.daily_ratings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily ratings"
ON public.daily_ratings FOR UPDATE
USING (auth.uid() = user_id);