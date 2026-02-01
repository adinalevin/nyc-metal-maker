// Type definitions for the existing Supabase database tables

export interface Offering {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  typical_lead_time_days: number | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: string;
  slug: string;
  name: string;
  short_label: string | null;
  description: string | null;
  service_category: string | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface Capability {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  sort_order: number | null;
  created_at: string;
  updated_at: string;
}

export interface Image {
  id: string;
  url: string;
  alt_text: string | null;
  caption: string | null;
  sort_order: number | null;
  created_at: string;
}

export interface OfferingService {
  offering_id: string;
  service_id: string;
}

export interface ServiceCapability {
  service_id: string;
  capability_id: string;
}

export interface OfferingCapability {
  offering_id: string;
  capability_id: string;
}

export interface OfferingImage {
  offering_id: string;
  image_id: string;
  sort_order: number | null;
}

export interface ServiceImage {
  service_id: string;
  image_id: string;
  sort_order: number | null;
}

export interface UiCopy {
  key: string;
  value: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Redirect {
  id: string;
  from_path: string;
  to_path: string;
  is_permanent: boolean;
  created_at: string;
}

// Joined types for convenience
export interface OfferingWithImages extends Offering {
  images?: Image[];
}

export interface ServiceWithCapabilities extends Service {
  capabilities?: Capability[];
  images?: Image[];
}
