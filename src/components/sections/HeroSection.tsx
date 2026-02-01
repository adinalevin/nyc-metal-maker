import { MapPin, Clock, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUiCopy } from "@/hooks/useSupabaseData";
import { FallingMetalParts } from "@/components/animations/FallingMetalParts";

export function HeroSection() {
  const { data: uiCopy } = useUiCopy();

  const scrollTo = (id: string) => {
    document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
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
              File-ready for DXF/DWG/STEP
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full">
              Revit exports supported
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-secondary rounded-full">
              Rush lane available
            </span>
          </div>

          {/* Main headline */}
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            Metal Parts for{" "}
            <span className="text-gradient-steel">NYC Construction</span>
          </h1>

          {/* Subheadline */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-8 leading-relaxed max-w-2xl">
            Connection plates, custom brackets, and mounting hardware—cut clean, deburred, 
            packed out, and ready for install.{" "}
            <span className="text-foreground font-medium">
              Typical turnaround: 2–5 business days.
            </span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap justify-center lg:justify-start gap-4 mb-10">
            <Button
              variant="hero"
              size="xl"
              onClick={() => scrollTo("#file-guide")}
            >
              {uiCopy?.cta_get_estimate || "Get an Estimate"}
            </Button>
            <Button
              variant="heroOutline"
              size="xl"
              onClick={() => scrollTo("#reorder")}
            >
              {uiCopy?.cta_reorder || "Reorder a Part"}
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
