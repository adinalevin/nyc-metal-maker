import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { 
  Offering, 
  Service, 
  Capability, 
  Image, 
  UiCopy, 
  Redirect,
  OfferingWithImages,
  ServiceWithCapabilities 
} from "@/types/database";

// Helper to query external Supabase tables (not in generated types)
const queryTable = (table: string) => {
  return (supabase as any).from(table);
};

// Fetch UI copy values
export function useUiCopy() {
  return useQuery({
    queryKey: ["ui_copy"],
    queryFn: async () => {
      const { data, error } = await queryTable("ui_copy").select("*");
      
      if (error) {
        console.error("Error fetching ui_copy:", error);
        return getDefaultUiCopy();
      }
      
      const copyMap: Record<string, string> = {};
      ((data as UiCopy[]) || []).forEach((item) => {
        copyMap[item.key] = item.value;
      });
      
      return { ...getDefaultUiCopy(), ...copyMap };
    },
  });
}

// Default UI copy values
function getDefaultUiCopy(): Record<string, string> {
  return {
    nav_offers_label: "Custom Parts",
    section_offers_heading: "Custom Parts Built to Spec",
    section_offers_subhead: "From prototype to production—precision metal parts for NYC construction.",
    cta_get_estimate: "Get an Estimate",
    cta_reorder: "Reorder a Part",
    label_part_id: "Part ID",
    label_revision: "Revision",
  };
}

// Fetch active offerings with images
export function useOfferings() {
  return useQuery({
    queryKey: ["offerings"],
    queryFn: async () => {
      const { data: offerings, error: offeringsError } = await queryTable("offerings")
        .select("*")
        .eq("is_active", true);
      
      if (offeringsError) {
        console.error("Error fetching offerings:", offeringsError);
        return [];
      }

      const { data: offeringImages } = await queryTable("offering_images")
        .select("offering_id, image_id, sort_order");

      const { data: images } = await queryTable("images").select("*");

      const imageMap = new Map(((images as Image[]) || []).map(img => [img.id, img]));
      
      const offeringsWithImages: OfferingWithImages[] = ((offerings as Offering[]) || []).map(offering => {
        const offeringImageRefs = (offeringImages || [])
          .filter((oi: any) => oi.offering_id === offering.id)
          .sort((a: any, b: any) => (a.sort_order || 0) - (b.sort_order || 0));
        
        const offeringImgs = offeringImageRefs
          .map((ref: any) => imageMap.get(ref.image_id))
          .filter(Boolean) as Image[];

        return { ...offering, images: offeringImgs };
      });

      // Custom sort: brkt-pack, pop-flat, proto-sprint first, then alphabetically
      const prioritySlugs = ["brkt-pack", "pop-flat", "proto-sprint"];
      
      return offeringsWithImages.sort((a, b) => {
        const aIndex = prioritySlugs.indexOf(a.slug);
        const bIndex = prioritySlugs.indexOf(b.slug);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.name.localeCompare(b.name);
      });
    },
  });
}

// Fetch active services grouped by category
export function useServices() {
  return useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data: services, error } = await queryTable("services")
        .select("*")
        .eq("is_active", true)
        .order("sort_order", { ascending: true });
      
      if (error) {
        console.error("Error fetching services:", error);
        return { services: [], grouped: {} };
      }

      const { data: serviceCapabilities } = await queryTable("service_capabilities")
        .select("service_id, capability_id");

      const { data: capabilities } = await queryTable("capabilities")
        .select("*")
        .eq("is_active", true);

      const capMap = new Map(((capabilities as Capability[]) || []).map(cap => [cap.id, cap]));
      
      const servicesWithCaps: ServiceWithCapabilities[] = ((services as Service[]) || []).map(service => {
        const capRefs = (serviceCapabilities || [])
          .filter((sc: any) => sc.service_id === service.id);
        
        const serviceCaps = capRefs
          .map((ref: any) => capMap.get(ref.capability_id))
          .filter(Boolean) as Capability[];

        return { ...service, capabilities: serviceCaps };
      });

      // Group by category
      const grouped: Record<string, ServiceWithCapabilities[]> = {};
      servicesWithCaps.forEach(service => {
        const category = service.service_category || "Other";
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(service);
      });

      return { services: servicesWithCaps, grouped };
    },
  });
}

// Fetch single offering by slug
export function useOfferingBySlug(slug: string) {
  return useQuery({
    queryKey: ["offering", slug],
    queryFn: async () => {
      const { data: offering, error } = await queryTable("offerings")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      
      if (error || !offering) return null;

      const typedOffering = offering as Offering;

      const [offeringImagesRes, offeringServicesRes, offeringCapabilitiesRes] = await Promise.all([
        queryTable("offering_images").select("image_id, sort_order").eq("offering_id", typedOffering.id),
        queryTable("offering_services").select("service_id").eq("offering_id", typedOffering.id),
        queryTable("offering_capabilities").select("capability_id").eq("offering_id", typedOffering.id),
      ]);

      const imageIds = (offeringImagesRes.data || []).map((oi: any) => oi.image_id);
      const serviceIds = (offeringServicesRes.data || []).map((os: any) => os.service_id);
      const capabilityIds = (offeringCapabilitiesRes.data || []).map((oc: any) => oc.capability_id);

      const [imagesRes, servicesRes, capabilitiesRes] = await Promise.all([
        imageIds.length ? queryTable("images").select("*").in("id", imageIds) : { data: [] },
        serviceIds.length ? queryTable("services").select("*").in("id", serviceIds) : { data: [] },
        capabilityIds.length ? queryTable("capabilities").select("*").in("id", capabilityIds) : { data: [] },
      ]);

      return {
        ...typedOffering,
        images: (imagesRes.data || []) as Image[],
        services: (servicesRes.data || []) as Service[],
        capabilities: (capabilitiesRes.data || []) as Capability[],
      };
    },
    enabled: !!slug,
  });
}

// Fetch single service by slug
export function useServiceBySlug(slug: string) {
  return useQuery({
    queryKey: ["service", slug],
    queryFn: async () => {
      const { data: service, error } = await queryTable("services")
        .select("*")
        .eq("slug", slug)
        .maybeSingle();
      
      if (error || !service) return null;

      const typedService = service as Service;

      const [serviceCapabilitiesRes, serviceImagesRes] = await Promise.all([
        queryTable("service_capabilities").select("capability_id").eq("service_id", typedService.id),
        queryTable("service_images").select("image_id, sort_order").eq("service_id", typedService.id),
      ]);

      const capabilityIds = (serviceCapabilitiesRes.data || []).map((sc: any) => sc.capability_id);
      const imageIds = (serviceImagesRes.data || []).map((si: any) => si.image_id);

      const [capabilitiesRes, imagesRes] = await Promise.all([
        capabilityIds.length ? queryTable("capabilities").select("*").in("id", capabilityIds) : { data: [] },
        imageIds.length ? queryTable("images").select("*").in("id", imageIds) : { data: [] },
      ]);

      return {
        ...typedService,
        capabilities: (capabilitiesRes.data || []) as Capability[],
        images: (imagesRes.data || []) as Image[],
      };
    },
    enabled: !!slug,
  });
}

// Fetch redirects
export function useRedirects() {
  return useQuery({
    queryKey: ["redirects"],
    queryFn: async () => {
      const { data, error } = await queryTable("redirects").select("*");
      
      if (error) {
        console.error("Error fetching redirects:", error);
        return [];
      }
      
      return (data || []) as Redirect[];
    },
  });
}
