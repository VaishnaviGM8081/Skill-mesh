-- Migration for Geo-aware Worker Matching Requirements

-- Add trust_score if it does not exist
ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS trust_score numeric DEFAULT 0.5;

-- Add latitude and longitude if they do not exist
-- (The original schema used PostGIS geometry, but for the lightweight demo
-- we are adding explicit latitude and longitude columns)
ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric;

-- Add skill_category if it does not exist (originally trade_category was used)
ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS skill_category VARCHAR(255);

-- Add pincode for fallback location matching
ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS pincode VARCHAR(20);

-- Ensure jobs table has matching columns if needed
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS latitude numeric,
ADD COLUMN IF NOT EXISTS longitude numeric;

-- Migrate existing trade_category to skill_category if needed
-- UPDATE public.workers SET skill_category = trade_category::text WHERE skill_category IS NULL;
