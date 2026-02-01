import { FileText, Info } from "lucide-react";
import { EstimateForm } from "@/components/forms/EstimateForm";

export function FileGuideSection() {
  return (
    <section id="file-guide" className="py-20 sm:py-28 bg-background">
      <div className="section-container">
        <div className="grid lg:grid-cols-5 gap-12">
          {/* Left: Info */}
          <div className="lg:col-span-2">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
              File Guide &{" "}
              <span className="text-gradient-amber">Get an Estimate</span>
            </h2>

            <p className="text-muted-foreground mb-6">
              Send us your files and specs. We'll evaluate your project and get back 
              with a quote—typically within a few hours.
            </p>

            {/* Accepted formats */}
            <div className="p-4 bg-secondary rounded-lg mb-6">
              <div className="flex items-start gap-3">
                <FileText className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground mb-1">Accepted Formats</p>
                  <p className="text-sm text-muted-foreground">
                    DXF, DWG, STEP, PDF. If you only have a pencil sketch, 
                    upload a JPG/PNG or PDF and we'll evaluate it.
                  </p>
                </div>
              </div>
            </div>

            {/* Tips */}
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                <p className="text-sm text-muted-foreground">
                  Revit exports supported—check our formats guide
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                <p className="text-sm text-muted-foreground">
                  Include tolerances if critical to your application
                </p>
              </div>
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
                <p className="text-sm text-muted-foreground">
                  Rush lane available for time-sensitive projects
                </p>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-3">
            <div className="card-industrial p-6 sm:p-8">
              <EstimateForm />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
