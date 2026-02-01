import { MapPin, Phone, Mail } from "lucide-react";

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-primary text-primary-foreground py-12">
      <div className="section-container">
        <div className="grid md:grid-cols-3 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center">
                <span className="text-accent-foreground font-display font-bold text-lg">M</span>
              </div>
              <div>
                <span className="font-display font-bold text-lg">Metal Parts</span>
                <span className="text-primary-foreground/70 text-sm ml-1">NYC</span>
              </div>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Precision metal fabrication for NYC construction. Connection plates, 
              custom brackets, and mounting hardware built to spec.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm text-primary-foreground/70">
              <li><a href="#what-we-make" className="hover:text-primary-foreground transition-colors">What We Make</a></li>
              <li><a href="#custom-parts" className="hover:text-primary-foreground transition-colors">Custom Parts</a></li>
              <li><a href="#file-guide" className="hover:text-primary-foreground transition-colors">Get an Estimate</a></li>
              <li><a href="#reorder" className="hover:text-primary-foreground transition-colors">Reorder</a></li>
              <li><a href="#faq" className="hover:text-primary-foreground transition-colors">FAQ</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold mb-4">Contact</h4>
            <ul className="space-y-3 text-sm text-primary-foreground/70">
              <li className="flex items-center gap-2">
                <MapPin size={16} className="text-accent" />
                <span>Brooklyn, NY 11237</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone size={16} className="text-accent" />
                <a href="tel:+16467419757" className="hover:text-primary-foreground transition-colors">
                  (646) 741-9757
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail size={16} className="text-accent" />
                <a href="mailto:quotes@metalpartsnyc.com" className="hover:text-primary-foreground transition-colors">
                  quotes@metalpartsnyc.com
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-primary-foreground/20 pt-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-primary-foreground/60">
            <p>© {currentYear} Metal Parts NYC by Collab. All rights reserved.</p>
            <p>NYC + 100 miles • Pickup + courier delivery</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
