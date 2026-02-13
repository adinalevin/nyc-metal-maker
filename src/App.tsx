import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import OfferingDetail from "./pages/OfferingDetail";
import ServiceDetail from "./pages/ServiceDetail";
import StatusPortal from "./pages/StatusPortal";
import OrderDetail from "./pages/OrderDetail";
import AdminPortal from "./pages/AdminPortal";
import DebugPage from "./pages/DebugPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/offers/:slug" element={<OfferingDetail />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/status" element={<StatusPortal />} />
          <Route path="/status/:id" element={<OrderDetail />} />
          <Route path="/admin" element={<AdminPortal />} />
          <Route path="/debug" element={<DebugPage />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
