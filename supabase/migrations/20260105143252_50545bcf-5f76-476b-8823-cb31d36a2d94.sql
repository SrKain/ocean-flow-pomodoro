-- Add spotify track information to cycle_records
ALTER TABLE public.cycle_records 
ADD COLUMN IF NOT EXISTS spotify_track_name TEXT,
ADD COLUMN IF NOT EXISTS spotify_artist TEXT,
ADD COLUMN IF NOT EXISTS spotify_album TEXT;

-- Create index for music analytics queries
CREATE INDEX IF NOT EXISTS idx_cycle_records_spotify_artist ON public.cycle_records(spotify_artist) WHERE spotify_artist IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cycle_records_rating ON public.cycle_records(rating) WHERE rating IS NOT NULL;