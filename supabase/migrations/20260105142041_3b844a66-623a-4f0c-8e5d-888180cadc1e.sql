-- Add rating column to cycle_records for cycle evaluation (1-5 stars)
ALTER TABLE public.cycle_records
ADD COLUMN rating INTEGER CHECK (rating >= 1 AND rating <= 5);