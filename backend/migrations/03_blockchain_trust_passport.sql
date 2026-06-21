-- Blockchain Trust Passport schema

ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS trust_score numeric DEFAULT 0;

ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS blockchain_verified BOOLEAN DEFAULT false;

ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS total_jobs INT DEFAULT 0;

ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS dispute_count INT DEFAULT 0;

ALTER TABLE public.workers
ADD COLUMN IF NOT EXISTS response_reliability numeric DEFAULT 1;

ALTER TABLE IF EXISTS public.job_chain_records
ADD COLUMN IF NOT EXISTS trust_score_snapshot numeric DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.job_chain_records (
  id SERIAL PRIMARY KEY,
  job_id INT UNIQUE REFERENCES public.jobs (id) ON DELETE CASCADE,
  worker_id INT REFERENCES public.workers (id) ON DELETE CASCADE,
  trust_score_snapshot numeric DEFAULT 0,
  blockchain_hash TEXT NOT NULL,
  transaction_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE IF EXISTS public.jobs
ADD COLUMN IF NOT EXISTS dispute_status BOOLEAN DEFAULT false;

ALTER TABLE IF EXISTS public.jobs
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;

ALTER TABLE IF EXISTS public.jobs
ADD COLUMN IF NOT EXISTS additional_requirements JSONB;
