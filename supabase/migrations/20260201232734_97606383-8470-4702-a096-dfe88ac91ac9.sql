-- Create orders table
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_type TEXT NOT NULL CHECK (request_type IN ('Estimate', 'Reorder')),
  status TEXT NOT NULL DEFAULT 'In Estimating',
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  company TEXT,
  customer_phone TEXT,
  
  -- Estimate-specific fields
  offering TEXT,
  material TEXT,
  thickness TEXT,
  custom_thickness TEXT,
  quantity TEXT,
  finish TEXT,
  material_sourcing TEXT,
  material_spec_details TEXT,
  addons JSONB,
  callback_requested BOOLEAN DEFAULT false,
  preferred_method TEXT,
  best_time TEXT,
  
  -- Reorder-specific fields
  part_id TEXT,
  revision TEXT,
  
  -- Common fields
  needed_by DATE,
  delivery_method TEXT,
  delivery_zip TEXT,
  file_link TEXT,
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order_files table
CREATE TABLE public.order_files (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  filename TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on orders
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Public can insert orders (anonymous form submissions)
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Public can read their own orders by email (for status lookup)
CREATE POLICY "Users can read orders by email"
ON public.orders
FOR SELECT
USING (true);

-- Enable RLS on order_files
ALTER TABLE public.order_files ENABLE ROW LEVEL SECURITY;

-- Public can insert order_files
CREATE POLICY "Anyone can create order_files"
ON public.order_files
FOR INSERT
WITH CHECK (true);

-- Public can read order_files
CREATE POLICY "Anyone can read order_files"
ON public.order_files
FOR SELECT
USING (true);

-- Create storage bucket for job uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-uploads', 'job-uploads', true);

-- Storage policy: Anyone can upload to job-uploads bucket
CREATE POLICY "Anyone can upload to job-uploads"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'job-uploads');

-- Storage policy: Anyone can read from job-uploads bucket
CREATE POLICY "Anyone can read job-uploads"
ON storage.objects
FOR SELECT
USING (bucket_id = 'job-uploads');

-- Create trigger for updated_at
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();