-- Add preview columns to broadcasts table
ALTER TABLE public.broadcasts
ADD COLUMN IF NOT EXISTS preview_title text,
ADD COLUMN IF NOT EXISTS preview_description text,
ADD COLUMN IF NOT EXISTS preview_image_url text,
ADD COLUMN IF NOT EXISTS preview_site text,
ADD COLUMN IF NOT EXISTS preview_fetch_status text CHECK (preview_fetch_status IN ('success', 'partial', 'fail', 'fetching')),
ADD COLUMN IF NOT EXISTS preview_fetched_at timestamptz;

-- Add index for fetch status to easily find stuck jobs or failed ones
CREATE INDEX IF NOT EXISTS broadcasts_preview_fetch_status_idx ON public.broadcasts (preview_fetch_status);
