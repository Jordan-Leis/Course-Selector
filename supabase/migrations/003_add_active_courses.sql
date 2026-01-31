-- Add active and last_seen_term columns to courses table
-- This allows us to soft-delete courses that are no longer offered

ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS active BOOLEAN NOT NULL DEFAULT true;

ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS last_seen_term TEXT;

-- Create index on active for faster filtering
CREATE INDEX IF NOT EXISTS idx_courses_active ON public.courses(active);

-- Create index on last_seen_term for tracking
CREATE INDEX IF NOT EXISTS idx_courses_last_seen_term ON public.courses(last_seen_term);

-- Set all existing courses as active by default (they'll be updated by sync script)
UPDATE public.courses SET active = true WHERE active IS NULL;
