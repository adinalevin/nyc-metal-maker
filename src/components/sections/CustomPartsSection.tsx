import { Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiCopy, useOfferings } from "@/hooks/useSupabaseData";
import type { OfferingWithImages } from "@/types/database";

function OfferingCard({ 
  offering, 
  ctaLabel 
}: { 
  offering: OfferingWithImages; 
  ctaLabel: string;
}) {
  const scrollToEstimate = () => {
    document.querySelector("#file-guide")?.scrollIntoView({ behavior: "smooth" });
  };

  const firstImage = offering.images?.[0];

  return (
    <div className="card-industrial p-6 flex flex-col h-full group">
      {/* Image */}
      {firstImage ? (
        <div className="aspect-video mb-4 rounded-lg overflow-hidden bg-muted">
          <img
            src={firstImage.url}
            alt={firstImage.alt_text || offering.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      ) : (
        <div className="aspect-video mb-4 rounded-lg bg-secondary flex items-center justify-center">
          <svg
            className="w-16 h-16 text-steel-light"
            viewBox="0 0 64 64"
            fill="none"
          >
            <rect
              x="8"
              y="8"
              width="48"
              height="48"
              rx="4"
              fill="currentColor"
              opacity="0.2"
              stroke="currentColor"
              strokeWidth="2"
            />
            <circle cx="20" cy="32" r="4" fill="currentColor" opacity="0.4" />
            <circle cx="32" cy="32" r="4" fill="currentColor" opacity="0.4" />
            <circle cx="44" cy="32" r="4" fill="currentColor" opacity="0.4" />
          </svg>
        </div>
      )}

      {/* Content */}
      <h3 className="font-display text-xl font-semibold text-foreground mb-2">
        {offering.name}
      </h3>
      
      {offering.description && (
        <p className="text-muted-foreground text-sm mb-4 flex-grow">
          {offering.description}
        </p>
      )}

      {/* Lead time */}
      {offering.typical_lead_time_days && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
          <Clock size={14} className="text-accent" />
          <span>Typical lead time: {offering.typical_lead_time_days} days</span>
        </div>
      )}

      {/* CTA */}
      <Button
        variant="outline"
        className="w-full group/btn"
        onClick={scrollToEstimate}
      >
        {ctaLabel}
        <ArrowRight size={16} className="ml-1 transition-transform group-hover/btn:translate-x-1" />
      </Button>
    </div>
  );
}

// Placeholder offerings when database is empty
const placeholderOfferings: OfferingWithImages[] = [
  {
    id: "1",
    slug: "brkt-pack",
    name: "Bracket Pack",
    description: "Pre-configured bracket sets for common mounting applications. Standard and custom sizes available.",
    typical_lead_time_days: 3,
    is_active: true,
    sort_order: 1,
    created_at: "",
    updated_at: "",
    images: [],
  },
  {
    id: "2",
    slug: "pop-flat",
    name: "Pop Flat Parts",
    description: "Flat-cut parts from sheet metal. Perfect for plates, gussets, and simple shapes.",
    typical_lead_time_days: 2,
    is_active: true,
    sort_order: 2,
    created_at: "",
    updated_at: "",
    images: [],
  },
  {
    id: "3",
    slug: "proto-sprint",
    name: "Proto Sprint",
    description: "Rush prototyping for time-sensitive projects. Same-day quoting, expedited production.",
    typical_lead_time_days: 1,
    is_active: true,
    sort_order: 3,
    created_at: "",
    updated_at: "",
    images: [],
  },
];

export function CustomPartsSection() {
  const { data: uiCopy } = useUiCopy();
  const { data: offerings, isLoading } = useOfferings();

  const displayOfferings = offerings && offerings.length > 0 ? offerings : placeholderOfferings;
  const heading = uiCopy?.section_offers_heading || "Custom Parts Built to Spec";
  const subhead = uiCopy?.section_offers_subhead || "From prototype to production—precision metal parts for NYC construction.";
  const ctaLabel = uiCopy?.cta_get_estimate || "Get an Estimate";

  return (
    <section id="custom-parts" className="py-20 sm:py-28 bg-muted/30">
      <div className="section-container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
            {heading}
          </h2>
          <p className="text-muted-foreground text-lg">
            {subhead}
          </p>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="card-industrial p-6 animate-pulse">
                <div className="aspect-video mb-4 rounded-lg bg-muted" />
                <div className="h-6 bg-muted rounded mb-2 w-3/4" />
                <div className="h-4 bg-muted rounded mb-4 w-full" />
                <div className="h-10 bg-muted rounded" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayOfferings.map((offering) => (
              <OfferingCard
                key={offering.id}
                offering={offering}
                ctaLabel={ctaLabel}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
