-- ================================================
-- SECURITY FIX: Restrict orders, order_files, and storage access
-- ================================================

-- 1. Drop overly permissive policies on orders table
DROP POLICY IF EXISTS "Users can read orders by email" ON public.orders;
DROP POLICY IF EXISTS "Anyone can create orders" ON public.orders;

-- 2. Drop overly permissive policies on order_files table
DROP POLICY IF EXISTS "Anyone can read order_files" ON public.order_files;
DROP POLICY IF EXISTS "Anyone can create order_files" ON public.order_files;

-- 3. Create restrictive policies - only service role can INSERT
-- (Edge Functions will use service role key)
CREATE POLICY "Service role can create orders"
ON public.orders
FOR INSERT
WITH CHECK (
  (SELECT auth.jwt()->>'role') = 'service_role'
);

CREATE POLICY "Service role can create order_files"
ON public.order_files
FOR INSERT
WITH CHECK (
  (SELECT auth.jwt()->>'role') = 'service_role'
);

-- 4. Create restrictive SELECT policies - only service role can read
CREATE POLICY "Service role can read orders"
ON public.orders
FOR SELECT
USING (
  (SELECT auth.jwt()->>'role') = 'service_role'
);

CREATE POLICY "Service role can read order_files"
ON public.order_files
FOR SELECT
USING (
  (SELECT auth.jwt()->>'role') = 'service_role'
);

-- 5. Create rate limit tracking table
CREATE TABLE IF NOT EXISTS public.order_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier text NOT NULL,
  submission_count integer DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  CONSTRAINT unique_rate_limit_identifier UNIQUE (identifier)
);

-- Enable RLS on rate limit table
ALTER TABLE public.order_rate_limits ENABLE ROW LEVEL SECURITY;

-- Only service role can access rate limits
CREATE POLICY "Service role manages rate limits"
ON public.order_rate_limits
FOR ALL
USING ((SELECT auth.jwt()->>'role') = 'service_role')
WITH CHECK ((SELECT auth.jwt()->>'role') = 'service_role');

-- 6. Add database constraints for input validation
ALTER TABLE public.orders
  ADD CONSTRAINT orders_email_length CHECK (char_length(customer_email) <= 255),
  ADD CONSTRAINT orders_name_length CHECK (char_length(customer_name) <= 100),
  ADD CONSTRAINT orders_phone_length CHECK (char_length(customer_phone) <= 20),
  ADD CONSTRAINT orders_notes_length CHECK (char_length(notes) <= 5000),
  ADD CONSTRAINT orders_material_spec_length CHECK (char_length(material_spec_details) <= 2000);

ALTER TABLE public.order_files
  ADD CONSTRAINT order_files_filename_length CHECK (char_length(filename) <= 255);

-- 7. Make storage bucket private and update policies
UPDATE storage.buckets 
SET public = false,
    file_size_limit = 10485760
WHERE id = 'job-uploads';

-- 8. Drop public read policy on storage
DROP POLICY IF EXISTS "Anyone can read job-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload to job-uploads" ON storage.objects;

-- 9. Create restrictive storage policies
CREATE POLICY "Service role can manage job-uploads"
ON storage.objects
FOR ALL
USING (
  bucket_id = 'job-uploads' 
  AND (SELECT auth.jwt()->>'role') = 'service_role'
)
WITH CHECK (
  bucket_id = 'job-uploads'
  AND (SELECT auth.jwt()->>'role') = 'service_role'
);