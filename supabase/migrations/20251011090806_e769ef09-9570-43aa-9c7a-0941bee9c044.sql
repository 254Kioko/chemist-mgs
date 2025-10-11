-- Add cost column to medicines table
ALTER TABLE public.medicines
ADD COLUMN cost numeric DEFAULT 0 NOT NULL;