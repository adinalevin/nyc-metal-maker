import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, FileText, Download, Send, Loader2, Clock, MessageSquare, Phone, Mail, CheckCircle, Edit3 } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const STATUS_STEPS = [
  "In Estimating",
  "Need Info",
  "Estimate Sent",
  "Payment Received",
  "In Queue",
  "In Production",
  "Ready",
  "Delivered",
];

function StatusTimeline({ currentStatus }: { currentStatus: string }) {
  const currentIndex = STATUS_STEPS.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {STATUS_STEPS.map((step, i) => {
        const isActive = i <= currentIndex;
        const isCurrent = step === currentStatus;
        return (
          <div key={step} className="flex items-center gap-1 flex-shrink-0">
            <div
              className={`text-xs px-2 py-1 rounded-full whitespace-nowrap ${
                isCurrent
                  ? "bg-foreground text-background font-semibold"
                  : isActive
                  ? "bg-muted-foreground/20 text-foreground"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step}
            </div>
            {i < STATUS_STEPS.length - 1 && (
              <div className={`w-4 h-px ${isActive ? "bg-foreground" : "bg-border"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

function AcceptanceConfirmation({ orderCode }: { orderCode: string }) {
  return (
    <div className="text-center py-12">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h2 className="font-display text-2xl font-bold text-foreground mb-2">Order Confirmed!</h2>
      <p className="text-muted-foreground mb-2">
        Your order <span className="font-semibold text-foreground">{orderCode}</span> has been accepted and payment received.
      </p>
      <p className="text-sm text-muted-foreground mb-6">
        We'll begin working on your order shortly. You can track progress on this page.
      </p>
      <Button asChild>
        <Link to="/status">Back to My Requests</Link>
      </Button>
    </div>
  );
}

interface QuoteAcceptancePanelProps {
  order: any;
  quote: any;
  onAccepted: () => void;
}

function QuoteAcceptancePanel({ order, quote, onAccepted }: QuoteAcceptancePanelProps) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [quantity, setQuantity] = useState(order.quantity || "");
  const [neededBy, setNeededBy] = useState(order.needed_by || "");
  const [notes, setNotes] = useState(order.notes || "");
  const [isProcessing, setIsProcessing] = useState(false);

  const updateOrder = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("orders")
        .update({
          quantity,
          needed_by: neededBy || null,
          notes: notes || null,
        })
        .eq("id", order.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] });
      setIsEditing(false);
      toast({ title: "Details updated" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleAcceptAndPay = async () => {
    setIsProcessing(true);
    try {
      // TODO: Replace with Stripe checkout session
      // For now, simulate payment processing
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update quote status to accepted
      const { error: quoteError } = await (supabase as any)
        .from("quotes")
        .update({ status: "accepted" })
        .eq("id", quote.id);
      if (quoteError) throw quoteError;

      // Update order status to Payment Received
      const { error: orderError } = await supabase
        .from("orders")
        .update({ status: "Payment Received" })
        .eq("id", order.id);
      if (orderError) throw orderError;

      queryClient.invalidateQueries({ queryKey: ["order-detail", order.id] });
      queryClient.invalidateQueries({ queryKey: ["order-quotes", order.id] });
      toast({ title: "Payment received!", description: "Your order is confirmed." });
      onAccepted();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="card-industrial p-5 mb-6 border-2 border-accent/30">
      <h2 className="font-display font-semibold text-foreground mb-1">Review & Accept Estimate</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Review your order details below. You can make changes before accepting.
      </p>

      {/* Editable fields */}
      <div className="space-y-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Quantity</label>
            {isEditing ? (
              <Input
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="e.g. 50"
              />
            ) : (
              <p className="text-sm text-foreground bg-muted rounded-md px-3 py-2">
                {quantity || "—"}
              </p>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-1 block">Needed By</label>
            {isEditing ? (
              <Input
                type="date"
                value={neededBy}
                onChange={(e) => setNeededBy(e.target.value)}
              />
            ) : (
              <p className="text-sm text-foreground bg-muted rounded-md px-3 py-2">
                {neededBy ? new Date(neededBy).toLocaleDateString() : "—"}
              </p>
            )}
          </div>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1 block">Notes</label>
          {isEditing ? (
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special instructions or changes..."
              rows={3}
            />
          ) : (
            <p className="text-sm text-foreground bg-muted rounded-md px-3 py-2 min-h-[2.5rem]">
              {notes || "—"}
            </p>
          )}
        </div>

        {isEditing ? (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => updateOrder.mutate()} disabled={updateOrder.isPending}>
              Save Changes
            </Button>
            <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="outline" onClick={() => setIsEditing(true)}>
            <Edit3 className="w-3 h-3 mr-1" /> Edit Details
          </Button>
        )}
      </div>

      {/* Quote summary + Accept */}
      <div className="border-t border-border pt-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Estimate Total</p>
            <span className="text-2xl font-bold text-foreground">
              ${(quote.amount_cents / 100).toFixed(2)}
            </span>
            {quote.description && (
              <p className="text-sm text-muted-foreground">{quote.description}</p>
            )}
            {quote.valid_until && (
              <p className="text-xs text-muted-foreground">
                Valid until {new Date(quote.valid_until).toLocaleDateString()}
              </p>
            )}
          </div>
        </div>
        <Button
          onClick={handleAcceptAndPay}
          disabled={isProcessing}
          className="w-full"
          size="lg"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              Processing Payment...
            </>
          ) : (
            `Accept & Pay $${(quote.amount_cents / 100).toFixed(2)}`
          )}
        </Button>
        <p className="text-xs text-muted-foreground text-center mt-2">
          Secure payment powered by Stripe (coming soon — placeholder for now)
        </p>
      </div>
    </div>
  );
}

export default function OrderDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [showConfirmation, setShowConfirmation] = useState(false);

  const { data: order, isLoading: orderLoading } = useQuery({
    queryKey: ["order-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: files } = useQuery({
    queryKey: ["order-files", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("order_files")
        .select("*")
        .eq("order_id", id!);
      if (error) throw error;
      return data || [];
    },
    enabled: !!id && !!user,
  });

  const { data: messages } = useQuery({
    queryKey: ["order-messages", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("order_messages")
        .select("*")
        .eq("order_id", id!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id && !!user,
  });

  const { data: quotes } = useQuery({
    queryKey: ["order-quotes", id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("quotes")
        .select("*")
        .eq("order_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!id && !!user,
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("order_messages").insert({
        order_id: id,
        sender_type: "customer",
        sender_email: user!.email,
        body: newMessage.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["order-messages", id] });
      toast({ title: "Message sent" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const handleDownload = async (storagePath: string, filename: string) => {
    const { data, error } = await supabase.functions.invoke("download-file", {
      body: { storage_path: storagePath },
    });
    if (error) {
      toast({ title: "Download error", description: error.message, variant: "destructive" });
      return;
    }
    if (data?.signedUrl) {
      window.open(data.signedUrl, "_blank");
    }
  };

  if (authLoading || orderLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="section-container text-center">
            <p className="text-muted-foreground mb-4">Please log in to view this request.</p>
            <Button asChild><Link to="/status">Go to Login</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="section-container text-center">
            <p className="text-muted-foreground mb-4">Request not found.</p>
            <Button asChild><Link to="/status">Back to Requests</Link></Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Find the latest pending quote for acceptance
  const pendingQuote = quotes?.find((q: any) => q.status === "pending");
  const canAccept = order.status === "Estimate Sent" && pendingQuote;

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="section-container max-w-3xl mx-auto">
            <AcceptanceConfirmation orderCode={order.order_code || "Request"} />
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
        <div className="section-container max-w-3xl mx-auto">
          {/* Back link */}
          <Link to="/status" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" /> Back to Requests
          </Link>

          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display text-2xl font-bold text-foreground mb-1">
              {order.order_code || "Request"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {order.request_type} • Submitted {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>

          {/* Status timeline */}
          <div className="mb-8">
            <StatusTimeline currentStatus={order.status} />
          </div>

          {/* Accept & Pay panel (shown when quote is pending and status is Estimate Sent) */}
          {canAccept && (
            <QuoteAcceptancePanel
              order={order}
              quote={pendingQuote}
              onAccepted={() => setShowConfirmation(true)}
            />
          )}

          {/* Specs summary */}
          <div className="card-industrial p-5 mb-6">
            <h2 className="font-display font-semibold text-foreground mb-3">Details</h2>
            <dl className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
              {order.offering && <><dt className="text-muted-foreground">Offering</dt><dd className="text-foreground">{order.offering}</dd></>}
              {order.material && <><dt className="text-muted-foreground">Material</dt><dd className="text-foreground">{order.material}</dd></>}
              {order.thickness && <><dt className="text-muted-foreground">Thickness</dt><dd className="text-foreground">{order.thickness === "Custom" ? order.custom_thickness : order.thickness}</dd></>}
              {order.quantity && <><dt className="text-muted-foreground">Quantity</dt><dd className="text-foreground">{order.quantity}</dd></>}
              {order.finish && <><dt className="text-muted-foreground">Finish</dt><dd className="text-foreground">{order.finish}</dd></>}
              {order.needed_by && <><dt className="text-muted-foreground">Needed By</dt><dd className="text-foreground">{new Date(order.needed_by).toLocaleDateString()}</dd></>}
              {order.delivery_method && <><dt className="text-muted-foreground">Delivery</dt><dd className="text-foreground">{order.delivery_method}{order.delivery_zip ? ` (${order.delivery_zip})` : ""}</dd></>}
              {order.notes && <><dt className="text-muted-foreground col-span-2">Notes</dt><dd className="text-foreground col-span-2">{order.notes}</dd></>}
            </dl>
          </div>

          {/* Quote (only show if not in acceptance mode) */}
          {quotes && quotes.length > 0 && !canAccept && (
            <div className="card-industrial p-5 mb-6">
              <h2 className="font-display font-semibold text-foreground mb-3">Estimate</h2>
              {quotes.map((q: any) => (
                <div key={q.id} className="flex items-center justify-between">
                  <div>
                    <span className="text-lg font-bold text-foreground">${(q.amount_cents / 100).toFixed(2)}</span>
                    {q.description && <p className="text-sm text-muted-foreground">{q.description}</p>}
                    {q.valid_until && <p className="text-xs text-muted-foreground">Valid until {new Date(q.valid_until).toLocaleDateString()}</p>}
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${q.status === "pending" ? "bg-muted text-foreground" : q.status === "accepted" ? "bg-green-100 text-green-800" : "bg-secondary text-secondary-foreground"}`}>
                    {q.status}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Files */}
          {files && files.length > 0 && (
            <div className="card-industrial p-5 mb-6">
              <h2 className="font-display font-semibold text-foreground mb-3">Files</h2>
              <ul className="space-y-2">
                {files.map((file) => (
                  <li key={file.id} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-foreground">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      {file.filename}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDownload(file.storage_path, file.filename)}
                    >
                      <Download className="w-3 h-3 mr-1" /> Download
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Messages */}
          <div className="card-industrial p-5 mb-6">
            <h2 className="font-display font-semibold text-foreground mb-3 flex items-center gap-2">
              <MessageSquare className="w-5 h-5" /> Messages
            </h2>
            {messages && messages.length > 0 ? (
              <div className="space-y-3 mb-4 max-h-80 overflow-y-auto">
                {messages.map((msg: any) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg text-sm ${
                      msg.sender_type === "customer"
                        ? "bg-secondary ml-8"
                        : "bg-muted mr-8"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-foreground">
                        {msg.sender_type === "customer" ? "You" : "Metal Parts NYC"}
                      </span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(msg.created_at).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-foreground">{msg.body}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground mb-4">No messages yet.</p>
            )}
            <div className="flex gap-2">
              <Textarea
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                rows={2}
                className="flex-1"
              />
              <Button
                onClick={() => sendMessage.mutate()}
                disabled={!newMessage.trim() || sendMessage.isPending}
                size="sm"
                className="self-end"
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Talk to a human */}
          <div className="p-5 bg-secondary rounded-lg text-center">
            <h3 className="font-display font-semibold text-foreground mb-2">Talk to a Human</h3>
            <p className="text-sm text-muted-foreground mb-3">Prefer to talk directly? We're here.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 text-sm">
              <a href="mailto:quotes@metalpartsnyc.com" className="flex items-center gap-2 text-foreground hover:underline">
                <Mail className="w-4 h-4" /> quotes@metalpartsnyc.com
              </a>
              <a href="tel:+16467419757" className="flex items-center gap-2 text-foreground hover:underline">
                <Phone className="w-4 h-4" /> (646) 741-9757
              </a>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
