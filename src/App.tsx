import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "./components/ThemeProvider";
import { FinalizingOrderScreen } from "./components/FinalizingOrderScreen";
import Index from "./pages/Index";
import Onboarding from "./pages/Onboarding";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCanceled from "./pages/PaymentCanceled";
import PaymentReturn from "./pages/PaymentReturn";
import { useEffect, useState } from "react";

import { AppProvider, useAppContext } from "./context/AppContext";

const queryClient = new QueryClient();

// Component to detect payment returns and show immediate loading
const PaymentLoadingDetector = () => {
  const location = useLocation();
  const { state, dispatch } = useAppContext();

  useEffect(() => {
    // Detect payment return with session_id parameter
    if (location.pathname === '/payment-return' && location.search.includes('session_id=')) {
      dispatch({ type: 'SET_PAYMENT_LOADING', payload: true });
    } else {
      // Clear payment loading when navigating away from payment-return
      if (state.isPaymentLoading && location.pathname !== '/payment-return') {
        dispatch({ type: 'SET_PAYMENT_LOADING', payload: false });
      }
    }
  }, [location, dispatch, state.isPaymentLoading]);

  if (state.isPaymentLoading) {
    return <FinalizingOrderScreen status="loading" />;
  }

  return null;
};

const AppContent = () => (
  <>
    <AppProvider>
      <PaymentLoadingDetector />
    </AppProvider>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/about" element={<AppProvider><About /></AppProvider>} />
      
      <Route path="/payment-return" element={<AppProvider><PaymentReturn /></AppProvider>} />
      <Route path="/payment-success" element={<AppProvider><PaymentSuccess /></AppProvider>} />
      <Route path="/payment-canceled" element={<PaymentCanceled />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="light" storageKey="civic-postcard-theme">
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
