import { useParams, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { useServiceBySlug, useUiCopy } from "@/hooks/useSupabaseData";

export default function ServiceDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: service, isLoading } = useServiceBySlug(slug || "");
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

  if (!service) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="section-container text-center">
            <h1 className="font-display text-3xl font-bold text-foreground mb-4">
              Service Not Found
            </h1>
            <p className="text-muted-foreground mb-6">
              The service you're looking for doesn't exist or has been removed.
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
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <div className="max-w-3xl">
            {/* Category badge */}
            {service.service_category && (
              <span className="inline-block px-3 py-1 bg-secondary text-sm rounded-full mb-4">
                {service.service_category}
              </span>
            )}

            <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              {service.name}
            </h1>

            {service.description && (
              <p className="text-muted-foreground text-lg mb-8">
                {service.description}
              </p>
            )}

            {/* Capabilities */}
            {service.capabilities && service.capabilities.length > 0 && (
              <div className="mb-8">
                <h3 className="font-semibold text-foreground mb-4">What's Included</h3>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {service.capabilities.map((cap: any) => (
                    <li
                      key={cap.id}
                      className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg"
                    >
                      <div className="w-2 h-2 bg-accent rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <span className="font-medium text-foreground">{cap.name}</span>
                        {cap.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {cap.description}
                          </p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Images */}
            {service.images && service.images.length > 0 && (
              <div className="mb-8">
                <div className="grid sm:grid-cols-2 gap-4">
                  {service.images.map((img: any) => (
                    <div key={img.id} className="rounded-xl overflow-hidden bg-muted">
                      <img
                        src={img.url}
                        alt={img.alt_text || service.name}
                        className="w-full h-48 object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Button variant="hero" size="lg" onClick={scrollToEstimate}>
              {uiCopy?.cta_get_estimate || "Get an Estimate"}
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
