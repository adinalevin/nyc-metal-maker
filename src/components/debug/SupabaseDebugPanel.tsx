import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Session } from "@supabase/supabase-js";

interface DebugResult {
  label: string;
  status: "success" | "error" | "pending";
  data?: unknown;
  error?: string;
}

export function SupabaseDebugPanel() {
  const [session, setSession] = useState<Session | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [results, setResults] = useState<DebugResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (result: DebugResult) => {
    setResults((prev) => [...prev, result]);
    console.log(`[Debug] ${result.label}:`, result.data || result.error);
  };

  const clearResults = () => setResults([]);

  // 1. Environment Check
  const checkEnvironment = () => {
    clearResults();
    const url = import.meta.env.VITE_SUPABASE_URL;
    const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
    
    addResult({
      label: "VITE_SUPABASE_URL",
      status: url ? "success" : "error",
      data: url ? `${url.slice(0, 30)}...` : "NOT SET",
    });
    
    addResult({
      label: "VITE_SUPABASE_PUBLISHABLE_KEY",
      status: key ? "success" : "error",
      data: key ? `${key.slice(0, 20)}...` : "NOT SET",
    });
  };

  // 2. Get Session
  const getSession = async () => {
    clearResults();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) {
        addResult({ label: "Get Session", status: "error", error: error.message });
      } else {
        setSession(data.session);
        addResult({
          label: "Get Session",
          status: data.session ? "success" : "pending",
          data: data.session
            ? { user_id: data.session.user.id, email: data.session.user.email }
            : "No active session",
        });
      }
    } catch (err) {
      addResult({ label: "Get Session", status: "error", error: String(err) });
    }
    setIsLoading(false);
  };

  // 3. Sign In
  const signIn = async () => {
    if (!email || !password) {
      addResult({ label: "Sign In", status: "error", error: "Email and password required" });
      return;
    }
    clearResults();
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        addResult({ label: "Sign In", status: "error", error: error.message });
      } else {
        setSession(data.session);
        addResult({
          label: "Sign In",
          status: "success",
          data: { user_id: data.user?.id, email: data.user?.email },
        });
      }
    } catch (err) {
      addResult({ label: "Sign In", status: "error", error: String(err) });
    }
    setIsLoading(false);
  };

  // 4. Sign Out
  const signOut = async () => {
    clearResults();
    setIsLoading(true);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        addResult({ label: "Sign Out", status: "error", error: error.message });
      } else {
        setSession(null);
        addResult({ label: "Sign Out", status: "success", data: "Signed out successfully" });
      }
    } catch (err) {
      addResult({ label: "Sign Out", status: "error", error: String(err) });
    }
    setIsLoading(false);
  };

  // 5. Test submit-order Edge Function
  const testSubmitOrder = async () => {
    clearResults();
    setIsLoading(true);
    try {
      const testPayload = {
        request_type: "Estimate" as const,
        status: "In Estimating",
        customer_email: "debug-test@example.com",
        customer_name: "Debug Test User",
        notes: `Debug panel test - ${new Date().toISOString()}`,
      };

      addResult({ label: "Calling submit-order", status: "pending", data: testPayload });

      const { data, error } = await supabase.functions.invoke("submit-order", {
        body: testPayload,
      });

      if (error) {
        addResult({
          label: "submit-order Response",
          status: "error",
          error: `${error.message} (${error.name})`,
        });
      } else {
        addResult({
          label: "submit-order Response",
          status: data?.success ? "success" : "error",
          data: {
            success: data?.success,
            orderId: data?.orderId,
            orderCode: data?.orderCode,
            error: data?.error,
          },
        });

        // 6. Post-insert verification
        if (data?.orderId) {
          await verifyOrder(data.orderId);
        }
      }
    } catch (err) {
      addResult({ label: "submit-order", status: "error", error: String(err) });
    }
    setIsLoading(false);
  };

  // 6. Verify Order (post-insert)
  const verifyOrder = async (orderId: string) => {
    try {
      // This will fail due to RLS (expected behavior - orders table blocks public SELECT)
      const { data: order, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      if (error) {
        addResult({
          label: "Verify Order (client SELECT)",
          status: "error",
          error: `RLS blocked as expected: ${error.message}`,
        });
      } else if (order) {
        addResult({
          label: "Verify Order (client SELECT)",
          status: "success",
          data: {
            id: order.id,
            order_code: order.order_code,
            status: order.status,
            customer_email: order.customer_email,
          },
        });
      } else {
        addResult({
          label: "Verify Order (client SELECT)",
          status: "pending",
          data: "No rows returned (RLS restricting visibility - this is expected for public schema)",
        });
      }
    } catch (err) {
      addResult({ label: "Verify Order", status: "error", error: String(err) });
    }
  };

  // 7. Test public tables (should work without auth)
  const testPublicTables = async () => {
    clearResults();
    setIsLoading(true);
    
    const tables = ["offerings", "services", "capabilities", "ui_copy"] as const;
    
    for (const table of tables) {
      try {
        const { data, error, count } = await supabase
          .from(table)
          .select("*", { count: "exact", head: false })
          .limit(5);

        if (error) {
          addResult({ label: `SELECT ${table}`, status: "error", error: error.message });
        } else {
          addResult({
            label: `SELECT ${table}`,
            status: "success",
            data: { count: data?.length || 0, sample: data?.[0] ? Object.keys(data[0]).join(", ") : "empty" },
          });
        }
      } catch (err) {
        addResult({ label: `SELECT ${table}`, status: "error", error: String(err) });
      }
    }
    setIsLoading(false);
  };

  // 8. Test connectivity
  const testConnectivity = async () => {
    clearResults();
    setIsLoading(true);
    try {
      // Simple query to test connection
      const { error } = await supabase.from("offerings").select("id").limit(1);
      
      if (error) {
        addResult({ label: "Connectivity Test", status: "error", error: error.message });
      } else {
        addResult({ label: "Connectivity Test", status: "success", data: "Connection successful - no CORS issues" });
      }
    } catch (err) {
      const errorStr = String(err);
      if (errorStr.includes("CORS") || errorStr.includes("NetworkError")) {
        addResult({
          label: "Connectivity Test",
          status: "error",
          error: `CORS/Network Error: ${errorStr}. Check Supabase Auth URL config.`,
        });
      } else {
        addResult({ label: "Connectivity Test", status: "error", error: errorStr });
      }
    }
    setIsLoading(false);
  };

  return (
    <Card className="w-full max-w-2xl mx-auto my-8 border-dashed border-2 border-yellow-500/50 bg-yellow-50/10">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          🔧 Supabase Debug Panel
          <Badge variant="outline" className="text-xs">DEV ONLY</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Session Status */}
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Session:</span>
          {session ? (
            <Badge variant="default" className="bg-green-600">{session.user.email}</Badge>
          ) : (
            <Badge variant="secondary">Not authenticated</Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={checkEnvironment} disabled={isLoading}>
            Check Env Vars
          </Button>
          <Button size="sm" variant="outline" onClick={testConnectivity} disabled={isLoading}>
            Test Connectivity
          </Button>
          <Button size="sm" variant="outline" onClick={getSession} disabled={isLoading}>
            Get Session
          </Button>
          <Button size="sm" variant="outline" onClick={testPublicTables} disabled={isLoading}>
            Test Public Tables
          </Button>
          <Button size="sm" variant="default" onClick={testSubmitOrder} disabled={isLoading}>
            Test submit-order
          </Button>
        </div>

        {/* Auth Form */}
        <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
          <p className="text-xs font-medium text-muted-foreground">Sign In (for authenticated tests)</p>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="debug-email" className="text-xs">Email</Label>
              <Input
                id="debug-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="test@example.com"
                className="h-8 text-sm"
              />
            </div>
            <div>
              <Label htmlFor="debug-password" className="text-xs">Password</Label>
              <Input
                id="debug-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="h-8 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="secondary" onClick={signIn} disabled={isLoading}>
              Sign In
            </Button>
            <Button size="sm" variant="ghost" onClick={signOut} disabled={isLoading || !session}>
              Sign Out
            </Button>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="border rounded-lg p-3 bg-muted/20 space-y-2 max-h-64 overflow-y-auto">
            <div className="flex justify-between items-center">
              <p className="text-xs font-medium text-muted-foreground">Results</p>
              <Button size="sm" variant="ghost" className="h-6 text-xs" onClick={clearResults}>
                Clear
              </Button>
            </div>
            {results.map((r, i) => (
              <div key={i} className="text-xs border-l-2 pl-2 py-1" style={{
                borderColor: r.status === "success" ? "#22c55e" : r.status === "error" ? "#ef4444" : "#eab308"
              }}>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{r.label}</span>
                  <Badge variant={r.status === "success" ? "default" : r.status === "error" ? "destructive" : "secondary"} className="text-[10px] h-4">
                    {r.status.toUpperCase()}
                  </Badge>
                </div>
                <pre className="text-[10px] text-muted-foreground mt-1 whitespace-pre-wrap break-all">
                  {r.error || JSON.stringify(r.data, null, 2)}
                </pre>
              </div>
            ))}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground">
          ⚠️ Remove this panel before production. Check browser console for full logs.
        </p>
      </CardContent>
    </Card>
  );
}
