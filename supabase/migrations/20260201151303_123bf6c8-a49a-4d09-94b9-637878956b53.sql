
-- UI Copy table for dynamic labels
CREATE TABLE public.ui_copy (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Offerings table (Custom Parts)
CREATE TABLE public.offerings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  typical_lead_time_days INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Services table
CREATE TABLE public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_label TEXT,
  description TEXT,
  service_category TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Capabilities table
CREATE TABLE public.capabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Images table
CREATE TABLE public.images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url TEXT NOT NULL,
  alt_text TEXT,
  caption TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Junction: offering_services
CREATE TABLE public.offering_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offering_id UUID NOT NULL REFERENCES public.offerings(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  UNIQUE(offering_id, service_id)
);

-- Junction: service_capabilities
CREATE TABLE public.service_capabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  capability_id UUID NOT NULL REFERENCES public.capabilities(id) ON DELETE CASCADE,
  UNIQUE(service_id, capability_id)
);

-- Junction: offering_capabilities
CREATE TABLE public.offering_capabilities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offering_id UUID NOT NULL REFERENCES public.offerings(id) ON DELETE CASCADE,
  capability_id UUID NOT NULL REFERENCES public.capabilities(id) ON DELETE CASCADE,
  UNIQUE(offering_id, capability_id)
);

-- Junction: offering_images
CREATE TABLE public.offering_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  offering_id UUID NOT NULL REFERENCES public.offerings(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(offering_id, image_id)
);

-- Junction: service_images
CREATE TABLE public.service_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  image_id UUID NOT NULL REFERENCES public.images(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  UNIQUE(service_id, image_id)
);

-- Redirects table
CREATE TABLE public.redirects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_path TEXT NOT NULL UNIQUE,
  to_path TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables (public read access for content tables)
ALTER TABLE public.ui_copy ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offerings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offering_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offering_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.offering_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.redirects ENABLE ROW LEVEL SECURITY;

-- Public read policies (this is a public-facing content site)
CREATE POLICY "Public read access" ON public.ui_copy FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.offerings FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.services FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.capabilities FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.images FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.offering_services FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.service_capabilities FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.offering_capabilities FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.offering_images FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.service_images FOR SELECT USING (true);
CREATE POLICY "Public read access" ON public.redirects FOR SELECT USING (true);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_ui_copy_updated_at BEFORE UPDATE ON public.ui_copy FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_offerings_updated_at BEFORE UPDATE ON public.offerings FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_capabilities_updated_at BEFORE UPDATE ON public.capabilities FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
