import { Phone, Mail, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ContactSection() {
  return (
    <section id="contact" className="py-20 sm:py-28 bg-muted/30">
      <div className="section-container">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Talk to a Human
            </h2>
            <p className="text-muted-foreground text-lg">
              Questions? Prefer to talk through your project? We're here.
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-6">
            {/* Phone */}
            <div className="card-industrial p-6 text-center">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Phone className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Call Us</h3>
              <a
                href="tel:+16467419757"
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                (646) 741-9757
              </a>
              <p className="text-sm text-muted-foreground mt-1">Mon–Fri, 7am–5pm</p>
            </div>

            {/* Text */}
            <div className="card-industrial p-6 text-center">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageCircle className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Text Us</h3>
              <a
                href="sms:+16467419757"
                className="text-muted-foreground hover:text-accent transition-colors"
              >
                (646) 741-9757
              </a>
              <p className="text-sm text-muted-foreground mt-1">Quick questions welcome</p>
            </div>

            {/* Email */}
            <div className="card-industrial p-6 text-center">
              <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="w-5 h-5 text-accent" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Email Us</h3>
              <a
                href="mailto:quotes@metalpartsnyc.com"
                className="text-muted-foreground hover:text-accent transition-colors text-sm"
              >
                quotes@metalpartsnyc.com
              </a>
              <p className="text-sm text-muted-foreground mt-1">We reply fast</p>
            </div>
          </div>

          {/* Location */}
          <div className="mt-10 card-industrial p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center">
                <MapPin className="w-5 h-5 text-steel" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Pickup Location</h3>
                <p className="text-muted-foreground">Brooklyn, NY 11237</p>
              </div>
            </div>
            <Button variant="outline" asChild>
              <a
                href="https://maps.google.com/?q=Brooklyn,NY,11237"
                target="_blank"
                rel="noopener noreferrer"
              >
                Get Directions
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
