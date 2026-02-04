import { SupabaseDebugPanel } from "@/components/debug/SupabaseDebugPanel";

const DebugPage = () => {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Supabase Integration Debug</h1>
        <p className="text-muted-foreground mb-8">
          Use this page to verify environment variables, auth, Edge Functions, and RLS behavior.
        </p>
        <SupabaseDebugPanel />
      </div>
    </div>
  );
};

export default DebugPage;
