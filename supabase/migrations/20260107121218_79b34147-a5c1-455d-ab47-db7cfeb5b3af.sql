-- Add tag_type column to distinguish focus tags from breath tags
ALTER TABLE public.tags 
ADD COLUMN tag_type text NOT NULL DEFAULT 'focus';

-- Add constraint for valid tag types
ALTER TABLE public.tags 
ADD CONSTRAINT tags_tag_type_check CHECK (tag_type IN ('focus', 'breath'));