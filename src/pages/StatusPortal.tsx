import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, LogOut, FileText, Clock, ArrowRight, Loader2 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const STATUS_COLORS: Record<string, string> = {
  "In Estimating": "bg-muted text-muted-foreground",
  "Need Info": "bg-accent text-accent-foreground",
  "Estimate Sent": "bg-secondary text-secondary-foreground",
  "Payment Received": "bg-primary text-primary-foreground",
  "In Queue": "bg-muted text-foreground",
  "In Production": "bg-primary text-primary-foreground",
  "Ready": "bg-foreground text-background",
  "Delivered": "bg-muted-foreground text-background",
  "Complete": "bg-foreground text-background",
};

function MagicLinkForm() {
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    const { error } = await signInWithMagicLink(email);
    setLoading(false);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setSent(true);
    }
  };

  if (sent) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-steel" />
        </div>
        <h2 className="font-display text-2xl font-bold text-foreground mb-3">Check your email</h2>
        <p className="text-muted-foreground mb-2">
          We sent a login link to <strong>{email}</strong>.
        </p>
        <p className="text-sm text-muted-foreground">
          Click the link in the email to view your requests. Don't see it? Check spam and mark us as "Not spam."
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
        <FileText className="w-8 h-8 text-steel" />
      </div>
      <h1 className="font-display text-3xl font-bold text-foreground mb-3">Client Portal</h1>
      <p className="text-muted-foreground mb-6">
        Enter the email you used for your estimate request to view your orders.
      </p>
      <form onSubmit={handleSubmit} className="max-w-sm mx-auto flex flex-col gap-3">
        <Input
          type="email"
          placeholder="you@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
          Send Login Link
        </Button>
      </form>
      <p className="text-xs text-muted-foreground mt-4">
        No password needed — we'll email you a secure link.
      </p>
    </div>
  );
}

function OrderList() {
  const { user, signOut } = useAuth();

  const { data: orders, isLoading } = useQuery({
    queryKey: ["my-orders", user?.email],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_code, status, request_type, created_at, offering, customer_name, company")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Your Requests</h1>
          <p className="text-muted-foreground text-sm mt-1">{user?.email}</p>
        </div>
        <Button variant="outline" size="sm" onClick={handleSignOut}>
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : !orders?.length ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">No requests found for this email.</p>
          <Button asChild>
            <Link to="/#file-guide">Submit an Estimate Request</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <Link
              key={order.id}
              to={`/status/${order.id}`}
              className="block card-industrial p-4 sm:p-5 hover:border-foreground/20"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-display font-semibold text-foreground">
                      {order.order_code || "Pending"}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        STATUS_COLORS[order.status] || "bg-muted text-muted-foreground"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{order.request_type}</span>
                    {order.offering && <span>• {order.offering}</span>}
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(order.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-10 p-4 bg-secondary rounded-lg text-center text-sm text-muted-foreground">
        <p>Need help? Email <a href="mailto:quotes@metalpartsnyc.com" className="underline text-foreground">quotes@metalpartsnyc.com</a> or call <a href="tel:+16467419757" className="underline text-foreground">(646) 741-9757</a></p>
      </div>
    </div>
  );
}

export default function StatusPortal() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="section-container">
          <div className="max-w-2xl mx-auto">
            {loading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : user ? (
              <OrderList />
            ) : (
              <MagicLinkForm />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
