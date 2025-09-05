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
import PaymentReturn from "./pages/PaymentReturn";
import PaymentRefunded from "./pages/PaymentRefunded";
import Share from "./pages/Share";
import { PreviewSendScreen } from "./components/screens/PreviewSendScreen";
import { LandingScreen } from "./components/screens/LandingScreen";
import { CraftMessageScreen } from "./components/screens/CraftMessageScreen";
import { ReviewEditScreen } from "./components/screens/ReviewEditScreen";
import { ReturnAddressScreen } from "./components/screens/ReturnAddressScreen";
import { ReviewCardScreen } from "./components/screens/ReviewCardScreen";
import { CheckoutScreen } from "./components/screens/CheckoutScreen";
import { DraftingScreen } from "./components/screens/DraftingScreen";
import { SuccessScreen } from "./components/screens/SuccessScreen";
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
  <AppProvider>
    <PaymentLoadingDetector />
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/onboarding" element={<Onboarding />} />
      <Route path="/about" element={<About />} />
      <Route path="/share" element={<Share />} />
      <Route path="/share/:orderId" element={<Share />} />
      
      <Route path="/payment-return" element={<PaymentReturn />} />
      <Route path="/payment-success" element={<PaymentSuccess />} />
      <Route path="/payment-refunded" element={<PaymentRefunded />} />
      
      
      {/* Direct routes for flow steps - for review purposes */}
      <Route path="/step-1-landing" element={<LandingScreen />} />
      <Route path="/step-2-craft-message" element={<CraftMessageScreen />} />
      <Route path="/step-3-review-edit" element={<ReviewEditScreen />} />
      <Route path="/step-4-return-address" element={<ReturnAddressScreen />} />
      <Route path="/step-5-review-card" element={<ReviewCardScreen />} />
      <Route path="/step-6-checkout" element={<CheckoutScreen />} />
      <Route path="/step-7-drafting" element={<DraftingScreen />} />
      <Route path="/step-8-success" element={<SuccessScreen />} />
      
      {/* Temporary routes for review */}
      <Route path="/preview-send" element={<PreviewSendScreen />} />
      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  </AppProvider>
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
