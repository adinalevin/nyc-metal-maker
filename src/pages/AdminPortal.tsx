import { Link } from "react-router-dom";
import { Lock } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";

export default function AdminPortal() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="section-container">
          <div className="max-w-xl mx-auto text-center">
            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
              <Lock className="w-8 h-8 text-steel" />
            </div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-4">
              Admin Portal
            </h1>
            <p className="text-muted-foreground mb-2">
              Internal operations dashboard.
            </p>
            <p className="text-sm text-muted-foreground mb-8">
              This area requires authentication. Coming soon.
            </p>
            <Button asChild>
              <Link to="/">Back to Home</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
