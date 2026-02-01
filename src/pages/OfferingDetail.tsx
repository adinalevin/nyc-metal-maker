import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Clock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useOfferingBySlug, useUiCopy } from "@/hooks/useSupabaseData";

export default function OfferingDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: offering, isLoading } = useOfferingBySlug(slug || "");
  const { data: uiCopy } = useUiCopy();

  const scrollToEstimate = () => {
    window.location.href = "/#file-guide";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="section-container">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-muted rounded w-1/3" />
              <div className="h-64 bg-muted rounded" />
              <div className="h-4 bg-muted rounded w-2/3" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!offering) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="section-container text-center">
            <h1 className="font-display text-3xl font-bold text-foreground mb-4">
              Part Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              The part you're looking for doesn't exist or has been removed.
            </p>
            <Button asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="section-container">
          {/* Back link */}
          <Link
            to="/#custom-parts"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Custom Parts
          </Link>

          <div className="grid lg:grid-cols-2 gap-12">
            {/* Image */}
            <div>
              {offering.images && offering.images.length > 0 ? (
                <div className="aspect-square rounded-xl overflow-hidden bg-muted">
                  <img
                    src={offering.images[0].url}
                    alt={offering.images[0].alt_text || offering.name}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="aspect-square rounded-xl bg-secondary flex items-center justify-center">
                  <svg
                    className="w-24 h-24 text-steel-light"
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
            </div>

            {/* Content */}
            <div>
              <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
                {offering.name}
              </h1>

              {offering.description && (
                <p className="text-muted-foreground text-lg mb-6">
                  {offering.description}
                </p>
              )}

              {offering.typical_lead_time_days && (
                <div className="flex items-center gap-2 text-muted-foreground mb-6">
                  <Clock size={18} className="text-accent" />
                  <span>Typical lead time: {offering.typical_lead_time_days} days</span>
                </div>
              )}

              {/* Services */}
              {offering.services && offering.services.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-foreground mb-3">Services</h3>
                  <div className="flex flex-wrap gap-2">
                    {offering.services.map((service: any) => (
                      <span
                        key={service.id}
                        className="px-3 py-1 bg-secondary text-sm rounded-full"
                      >
                        {service.short_label || service.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Capabilities */}
              {offering.capabilities && offering.capabilities.length > 0 && (
                <div className="mb-8">
                  <h3 className="font-semibold text-foreground mb-3">Capabilities</h3>
                  <div className="flex flex-wrap gap-2">
                    {offering.capabilities.map((cap: any) => (
                      <span
                        key={cap.id}
                        className="px-3 py-1 bg-accent/10 text-accent text-sm rounded-full"
                      >
                        {cap.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Button variant="hero" size="lg" onClick={scrollToEstimate}>
                {uiCopy?.cta_get_estimate || "Get an Estimate"}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
