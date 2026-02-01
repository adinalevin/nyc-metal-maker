import { MapPin, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiCopy } from "@/hooks/useSupabaseData";
import { FallingMetalParts } from "@/components/animations/FallingMetalParts";

export function HeroSection() {
  const { data: uiCopy } = useUiCopy();

  const scrollTo = (id: string, focusUpload = false) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
    if (focusUpload) {
      // Dispatch event after scroll completes
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent("focus-estimate-upload"));
      }, 600);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center bg-hero-gradient overflow-hidden pt-20">
      {/* Falling metal animation */}
      <FallingMetalParts />
      
      {/* Metal texture overlay */}
      <div className="absolute inset-0 metal-texture pointer-events-none" />
      
      <div className="section-container relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center lg:text-left">
          {/* Micro line */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-3 mb-6 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full">
              <FileText size={14} className="text-accent" />
              DXF/DWG/STEP/PDF
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full">
              Sketches accepted
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full">
              Rush lane available
            </span>
          </div>

          {/* Main headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Custom Metal Parts in NYC
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
            Parts and assemblies—cut, drilled, welded, bent, and finished to your spec. 
            From one-off prototypes to production runs.{" "}
            <span className="text-foreground font-medium">
              Standard turnaround: 2–5 business days. Have a rush, we will make it happen.
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-10">
            <Button
              variant="hero"
              size="xl"
              onClick={() => scrollTo("#file-guide", true)}
            >
              Get an Estimate
            </Button>
            <Button
              variant="heroOutline"
              size="xl"
              onClick={() => scrollTo("#reorder")}
            >
              Reorder by Part ID
            </Button>
          </div>

          {/* Trust line */}
          <div className="flex flex-wrap justify-center lg:justify-start items-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-accent" />
              <span>Brooklyn, NY 11237</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <span>NYC + 100 miles</span>
            <div className="hidden sm:block w-px h-4 bg-border" />
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-accent" />
              <span>Pickup + courier delivery</span>
            </div>
          </div>
        </div>
      </div>

      {/* Decorative gradient at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
}
