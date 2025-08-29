
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FinalizingOrderScreen } from '@/components/FinalizingOrderScreen';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ordering' | 'error'>('loading');
  const [orderingResults, setOrderingResults] = useState<any>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [startTime] = useState<number>(Date.now()); // Remove setStartTime since we don't update it
  const { toast } = useToast();
  const { state, dispatch } = useAppContext();

  // Enhanced validation for postcard data
  const validatePostcardData = (data: any): boolean => {
    if (!data) {
      return false;
    }
    
    // Check userInfo
    if (!data.userInfo) {
      return false;
    }
    
    if (!data.userInfo.fullName) {
      return false;
    }
    
    if (!data.userInfo.streetAddress) {
      return false;
    }
    
    // Check representative
    if (!data.representative) {
      return false;
    }
    
    if (!data.representative.name) {
      return false;
    }
    
    // Check message
    if (!data.finalMessage) {
      return false;
    }
    
    return true;
  };

  // Get postcard data from AppContext (which now auto-restores from storage)
  const getPostcardData = () => {
    if (validatePostcardData(state.postcardData)) {
      return state.postcardData;
    }
    
    return null;
  };

  const orderPostcardsWithData = async (postcardData: any) => {
    try {
      setStatus('ordering');
      
      if (!postcardData || !validatePostcardData(postcardData)) {
        // Clear any corrupted storage data
        sessionStorage.removeItem('appContextBackup');
        localStorage.removeItem('postcardData');
        
        toast({
          title: "Session expired",
          description: "Please start the postcard process again.",
          variant: "destructive",
        });
        
        setTimeout(() => {
          navigate('/onboarding');
        }, 3000);
        return;
      }
      
      const { data, error } = await supabase.functions.invoke('send-postcard', {
        body: { postcardData }
      });
      
      if (error) {
        throw error;
      }
      
      setOrderingResults(data);
      
      if (data.success) {
        // Ensure minimum 4 seconds before navigating
        const elapsed = Date.now() - startTime;
        const minTime = 4000; // 4 seconds
        const remainingTime = Math.max(0, minTime - elapsed);
        
        setTimeout(() => {
          // Clear global payment loading before navigating to success
          dispatch({ type: 'SET_PAYMENT_LOADING', payload: false });
          navigate('/payment-success', { 
            state: { 
              sessionId: searchParams.get('session_id'),
              orderingResults: data 
            }
          });
        }, remainingTime);
      } else {
        setStatus('error');
        // Clear global payment loading on error
        dispatch({ type: 'SET_PAYMENT_LOADING', payload: false });
        toast({
          title: "Some postcards failed to order",
          description: `${data.summary.totalSent} ordered, ${data.summary.totalFailed} failed.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      setStatus('error');
      setOrderingResults({ error: error.message });
      // Clear global payment loading on error
      dispatch({ type: 'SET_PAYMENT_LOADING', payload: false });
      toast({
        title: "Failed to order postcards",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    }
  };

  const retryPostcardOrdering = async () => {
    setRetryAttempts(prev => prev + 1);
    const postcardData = getPostcardData();
    if (postcardData) {
      await orderPostcardsWithData(postcardData);
    }
  };

  const verifyPaymentAndOrder = async (sessionId: string) => {
    try {
      // Verify payment with Stripe
      const { data: verificationResult, error: verificationError } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId }
      });
      
      if (verificationError) {
        throw new Error('Failed to verify payment status');
      }
      
      if (!verificationResult) {
        throw new Error('No verification response received');
      }
      
      if (!verificationResult.success) {
        setStatus('error');
        toast({
          title: "Payment verification failed",
          description: "Unable to confirm payment. Please contact support.",
          variant: "destructive",
        });
        setTimeout(() => {
          navigate('/payment-canceled');
        }, 3000);
        return;
      }
      
      // Use postcard data from payment session metadata
      if (verificationResult.postcardData) {        
        // Update app state with the postcard data from payment session
        dispatch({ 
          type: 'UPDATE_POSTCARD_DATA', 
          payload: verificationResult.postcardData 
        });
        
        // Start ordering immediately with session data (pass data directly to avoid state timing issues)
        orderPostcardsWithData(verificationResult.postcardData);
      } else {
        setStatus('error');
        // Clear global payment loading on error
        dispatch({ type: 'SET_PAYMENT_LOADING', payload: false });
        toast({
          title: "Session data missing",
          description: "Unable to find your postcard data. Please start over.",
          variant: "destructive",
        });
        setTimeout(() => {
          navigate('/onboarding');
        }, 3000);
        return;
      }
      
    } catch (error) {
      setStatus('error');
      // Clear global payment loading on error
      dispatch({ type: 'SET_PAYMENT_LOADING', payload: false });
      toast({
        title: "Payment verification failed",
        description: "Unable to verify payment. Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      // Immediately start verification without any delay
      verifyPaymentAndOrder(sessionId);
    } else {
      setStatus('error');
      // Clear global payment loading on error
      dispatch({ type: 'SET_PAYMENT_LOADING', payload: false });
      setTimeout(() => {
        navigate('/payment-canceled');
      }, 3000);
    }
  }, [searchParams, navigate, dispatch]);

  // Always show the FinalizingOrderScreen - no fallback card
  return (
    <FinalizingOrderScreen 
      status={status === 'ordering' ? 'loading' : status}
      onRetry={retryAttempts < 3 ? retryPostcardOrdering : undefined}
    />
  );
}
