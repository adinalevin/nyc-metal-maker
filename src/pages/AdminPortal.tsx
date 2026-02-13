import { useState } from "react";
import { Link } from "react-router-dom";
import { Lock, LogOut, Loader2, ChevronDown, Send, Download, FileText, Clock, MessageSquare, DollarSign } from "lucide-react";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";

const STATUSES = [
  "In Estimating", "Need Info", "Estimate Sent", "Payment Received",
  "In Queue", "In Production", "Ready", "Delivered",
];

function AdminLogin() {
  const { signInWithMagicLink } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      <div className="max-w-md mx-auto text-center">
        <Lock className="w-8 h-8 mx-auto mb-4 text-steel" />
        <h2 className="font-display text-xl font-bold mb-2">Check your email</h2>
        <p className="text-sm text-muted-foreground">Login link sent to {email}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto text-center">
      <Lock className="w-8 h-8 mx-auto mb-4 text-steel" />
      <h1 className="font-display text-2xl font-bold mb-2">Admin Portal</h1>
      <p className="text-sm text-muted-foreground mb-6">Sign in with your admin email.</p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <Input type="email" placeholder="admin@metalpartsnyc.com" value={email} onChange={e => setEmail(e.target.value)} required />
        <Button type="submit" disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Sign In
        </Button>
      </form>
    </div>
  );
}

function OrderDetailPanel({ orderId, onClose }: { orderId: string; onClose: () => void }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newMessage, setNewMessage] = useState("");
  const [quoteAmount, setQuoteAmount] = useState("");
  const [quoteDesc, setQuoteDesc] = useState("");

  const { data: order } = useQuery({
    queryKey: ["admin-order", orderId],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: files } = useQuery({
    queryKey: ["admin-order-files", orderId],
    queryFn: async () => {
      const { data, error } = await supabase.from("order_files").select("*").eq("order_id", orderId);
      if (error) throw error;
      return data || [];
    },
  });

  const { data: messages } = useQuery({
    queryKey: ["admin-order-messages", orderId],
    queryFn: async () => {
      const { data, error } = await (supabase as any).from("order_messages").select("*").eq("order_id", orderId).order("created_at", { ascending: true });
      if (error) throw error;
      return data || [];
    },
  });

  const updateStatus = useMutation({
    mutationFn: async (newStatus: string) => {
      const { error } = await supabase.from("orders").update({ status: newStatus } as any).eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Status updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const sendMessage = useMutation({
    mutationFn: async () => {
      const { error } = await (supabase as any).from("order_messages").insert({
        order_id: orderId,
        sender_type: "team",
        sender_email: user!.email,
        body: newMessage.trim(),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["admin-order-messages", orderId] });
      toast({ title: "Message sent" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const sendQuote = useMutation({
    mutationFn: async () => {
      const cents = Math.round(parseFloat(quoteAmount) * 100);
      const { error } = await (supabase as any).from("quotes").insert({
        order_id: orderId,
        amount_cents: cents,
        description: quoteDesc || null,
        valid_until: new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0],
      });
      if (error) throw error;
      // Also update status
      await supabase.from("orders").update({ status: "Estimate Sent" } as any).eq("id", orderId);
    },
    onSuccess: () => {
      setQuoteAmount("");
      setQuoteDesc("");
      queryClient.invalidateQueries({ queryKey: ["admin-order", orderId] });
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({ title: "Estimate sent" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const handleDownload = async (storagePath: string) => {
    const { data, error } = await supabase.functions.invoke("download-file", {
      body: { storage_path: storagePath },
    });
    if (error) {
      toast({ title: "Download error", description: error.message, variant: "destructive" });
      return;
    }
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  if (!order) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-2xl bg-background border-l border-border overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-display text-xl font-bold">{order.order_code || "Order"}</h2>
          <Button variant="outline" size="sm" onClick={onClose}>Close</Button>
        </div>

        {/* Status selector */}
        <div className="mb-6">
          <label className="text-sm font-medium text-foreground mb-2 block">Status</label>
          <Select value={order.status} onValueChange={(v) => updateStatus.mutate(v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {/* Customer info */}
        <div className="mb-6 text-sm">
          <h3 className="font-semibold mb-2">Customer</h3>
          <p>{order.customer_name || "—"} {order.company ? `(${order.company})` : ""}</p>
          <p className="text-muted-foreground">{order.customer_email}</p>
          {order.customer_phone && <p className="text-muted-foreground">{order.customer_phone}</p>}
        </div>

        {/* Specs */}
        <div className="mb-6 text-sm">
          <h3 className="font-semibold mb-2">Specs</h3>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1">
            {order.request_type && <><dt className="text-muted-foreground">Type</dt><dd>{order.request_type}</dd></>}
            {order.offering && <><dt className="text-muted-foreground">Offering</dt><dd>{order.offering}</dd></>}
            {order.material && <><dt className="text-muted-foreground">Material</dt><dd>{order.material}</dd></>}
            {order.thickness && <><dt className="text-muted-foreground">Thickness</dt><dd>{order.thickness === "Custom" ? order.custom_thickness : order.thickness}</dd></>}
            {order.quantity && <><dt className="text-muted-foreground">Qty</dt><dd>{order.quantity}</dd></>}
            {order.finish && <><dt className="text-muted-foreground">Finish</dt><dd>{order.finish}</dd></>}
            {order.needed_by && <><dt className="text-muted-foreground">Needed By</dt><dd>{new Date(order.needed_by).toLocaleDateString()}</dd></>}
            {order.delivery_method && <><dt className="text-muted-foreground">Delivery</dt><dd>{order.delivery_method}</dd></>}
          </dl>
          {order.notes && <p className="mt-2 text-muted-foreground">Notes: {order.notes}</p>}
        </div>

        {/* Files */}
        {files && files.length > 0 && (
          <div className="mb-6">
            <h3 className="font-semibold text-sm mb-2">Files</h3>
            <ul className="space-y-1">
              {files.map(f => (
                <li key={f.id} className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-2"><FileText className="w-4 h-4" />{f.filename}</span>
                  <Button variant="outline" size="sm" onClick={() => handleDownload(f.storage_path)}>
                    <Download className="w-3 h-3" />
                  </Button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Send Estimate */}
        <div className="mb-6 p-4 border border-border rounded-lg">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><DollarSign className="w-4 h-4" /> Send Estimate</h3>
          <div className="flex gap-2 mb-2">
            <Input type="number" placeholder="Amount ($)" value={quoteAmount} onChange={e => setQuoteAmount(e.target.value)} step="0.01" min="0" />
          </div>
          <Input placeholder="Description (optional)" value={quoteDesc} onChange={e => setQuoteDesc(e.target.value)} className="mb-2" />
          <Button size="sm" onClick={() => sendQuote.mutate()} disabled={!quoteAmount || sendQuote.isPending}>
            Send Estimate
          </Button>
        </div>

        {/* Messages */}
        <div className="mb-6">
          <h3 className="font-semibold text-sm mb-2 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Messages</h3>
          {messages && messages.length > 0 ? (
            <div className="space-y-2 mb-3 max-h-60 overflow-y-auto">
              {messages.map((msg: any) => (
                <div key={msg.id} className={`p-2 rounded text-xs ${msg.sender_type === "team" ? "bg-secondary ml-6" : "bg-muted mr-6"}`}>
                  <div className="flex justify-between mb-0.5">
                    <span className="font-medium">{msg.sender_type === "team" ? "Team" : msg.sender_email}</span>
                    <span className="text-muted-foreground">{new Date(msg.created_at).toLocaleString()}</span>
                  </div>
                  <p>{msg.body}</p>
                </div>
              ))}
            </div>
          ) : <p className="text-xs text-muted-foreground mb-3">No messages.</p>}
          <div className="flex gap-2">
            <Textarea placeholder="Reply..." value={newMessage} onChange={e => setNewMessage(e.target.value)} rows={2} className="flex-1 text-sm" />
            <Button size="sm" onClick={() => sendMessage.mutate()} disabled={!newMessage.trim() || sendMessage.isPending} className="self-end">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: isAdmin, isLoading: roleLoading } = useQuery({
    queryKey: ["is-admin", user?.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("user_roles")
        .select("role")
        .eq("user_id", user!.id)
        .eq("role", "admin")
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user,
  });

  const { data: orders, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, order_code, status, request_type, created_at, customer_email, customer_name, company, offering")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user && isAdmin === true,
  });

  if (roleLoading) {
    return <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>;
  }

  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto text-center">
        <Lock className="w-8 h-8 mx-auto mb-4 text-steel" />
        <h2 className="font-display text-xl font-bold mb-2">Access Denied</h2>
        <p className="text-sm text-muted-foreground mb-4">Your account doesn't have admin access.</p>
        <Button variant="outline" onClick={() => signOut()}>Sign Out</Button>
      </div>
    );
  }

  const filteredOrders = filterStatus === "all" ? orders : orders?.filter(o => o.status === filterStatus);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display text-2xl font-bold">Order Queue</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground">{user?.email}</span>
          <Button variant="outline" size="sm" onClick={() => signOut()}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Filter */}
      <div className="mb-4">
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
      ) : (
        <div className="border border-border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left p-3 font-medium">Request ID</th>
                <th className="text-left p-3 font-medium">Customer</th>
                <th className="text-left p-3 font-medium">Type</th>
                <th className="text-left p-3 font-medium">Status</th>
                <th className="text-left p-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders?.map(order => (
                <tr
                  key={order.id}
                  className="border-t border-border hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedOrder(order.id)}
                >
                  <td className="p-3 font-medium">{order.order_code || "—"}</td>
                  <td className="p-3">
                    <div>{order.customer_name || order.customer_email}</div>
                    {order.company && <div className="text-xs text-muted-foreground">{order.company}</div>}
                  </td>
                  <td className="p-3">{order.request_type}</td>
                  <td className="p-3"><span className="text-xs bg-muted px-2 py-0.5 rounded-full">{order.status}</span></td>
                  <td className="p-3 text-muted-foreground">{new Date(order.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
              {!filteredOrders?.length && (
                <tr><td colSpan={5} className="p-6 text-center text-muted-foreground">No orders found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {selectedOrder && <OrderDetailPanel orderId={selectedOrder} onClose={() => setSelectedOrder(null)} />}
    </div>
  );
}

export default function AdminPortal() {
  const { user, loading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-20">
        <div className="section-container">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin" /></div>
          ) : user ? (
            <AdminDashboard />
          ) : (
            <AdminLogin />
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
