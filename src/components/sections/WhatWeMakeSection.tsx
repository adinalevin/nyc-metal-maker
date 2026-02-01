import { CheckCircle2 } from "lucide-react";

const capabilities = [
  "Connection plates (base plates, splice plates, moment plates)",
  "Gusset plates, shear tabs, clip angles",
  "Custom brackets and mounting plates",
  "HVAC and equipment mounting hardware",
  "Supports, frames, small welded assemblies",
];

export function WhatWeMakeSection() {
  return (
    <section id="what-we-make" className="py-20 sm:py-28 bg-background">
      <div className="section-container">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Content */}
          <div>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-6">
              Structural Steel Components{" "}
              <span className="text-gradient-steel">That Fit the First Time</span>
            </h2>

            <ul className="space-y-4 mb-8">
              {capabilities.map((item, index) => (
                <li key={index} className="flex items-start gap-3">
                  <CheckCircle2 
                    className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" 
                  />
                  <span className="text-muted-foreground">{item}</span>
                </li>
              ))}
            </ul>

            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/10 text-accent rounded-lg font-medium">
              <span className="w-2 h-2 bg-accent rounded-full animate-pulse" />
              Prototype-to-production runs supported
            </div>
          </div>

          {/* Visual */}
          <div className="relative">
            <div className="aspect-square max-w-md mx-auto">
              {/* Decorative metal parts illustration */}
              <div className="absolute inset-0 bg-secondary rounded-2xl overflow-hidden">
                <div className="absolute inset-4 border-2 border-dashed border-steel-light/30 rounded-xl" />
                
                {/* Stylized bracket shapes */}
                <svg
                  className="absolute inset-0 w-full h-full text-steel"
                  viewBox="0 0 400 400"
                  fill="none"
                >
                  {/* Large L-bracket */}
                  <path
                    d="M80 100h80v40H120v160H80V100z"
                    fill="currentColor"
                    opacity="0.15"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  {/* Bolt holes */}
                  <circle cx="100" cy="120" r="8" fill="currentColor" opacity="0.3" />
                  <circle cx="140" cy="120" r="8" fill="currentColor" opacity="0.3" />
                  <circle cx="100" cy="200" r="8" fill="currentColor" opacity="0.3" />
                  <circle cx="100" cy="260" r="8" fill="currentColor" opacity="0.3" />

                  {/* Gusset plate */}
                  <path
                    d="M200 80L320 80L320 200Z"
                    fill="currentColor"
                    opacity="0.12"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle cx="240" cy="100" r="8" fill="currentColor" opacity="0.3" />
                  <circle cx="290" cy="100" r="8" fill="currentColor" opacity="0.3" />
                  <circle cx="290" cy="150" r="8" fill="currentColor" opacity="0.3" />

                  {/* Base plate */}
                  <rect
                    x="180"
                    y="260"
                    width="140"
                    height="60"
                    rx="4"
                    fill="currentColor"
                    opacity="0.15"
                    stroke="currentColor"
                    strokeWidth="2"
                  />
                  <circle cx="210" cy="290" r="10" fill="currentColor" opacity="0.3" />
                  <circle cx="250" cy="290" r="10" fill="currentColor" opacity="0.3" />
                  <circle cx="290" cy="290" r="10" fill="currentColor" opacity="0.3" />
                </svg>

                {/* Measurement lines */}
                <div className="absolute top-8 left-8 right-8 flex items-center gap-2 text-xs text-steel">
                  <div className="flex-1 h-px bg-steel/30" />
                  <span className="font-mono">400mm</span>
                  <div className="flex-1 h-px bg-steel/30" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
