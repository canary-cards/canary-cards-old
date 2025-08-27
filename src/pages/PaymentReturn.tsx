import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { RobotLoadingScreen } from '@/components/RobotLoadingScreen';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ordering' | 'error'>('loading');
  const [orderingResults, setOrderingResults] = useState<any>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
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
          navigate('/payment-success', { 
            state: { 
              sessionId: searchParams.get('session_id'),
              orderingResults: data 
            }
          });
        }, remainingTime);
      } else {
        setStatus('error');
        toast({
          title: "Some postcards failed to order",
          description: `${data.summary.totalSent} ordered, ${data.summary.totalFailed} failed.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      setStatus('error');
      setOrderingResults({ error: error.message });
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
        
        setStatus('ordering');
        
        // Start ordering immediately with session data (pass data directly to avoid state timing issues)
        orderPostcardsWithData(verificationResult.postcardData);
      } else {
        setStatus('error');
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
      setStartTime(Date.now());
      setStatus('loading');
      verifyPaymentAndOrder(sessionId);
    } else {
      setStatus('error');
      setTimeout(() => {
        navigate('/payment-canceled');
      }, 3000);
    }
  }, [searchParams, navigate]);

  // Show robot loading screen for ordering state, fallback card for error
  if (status === 'ordering') {
    return (
      <RobotLoadingScreen 
        status="loading"
        onRetry={retryAttempts < 3 ? retryPostcardOrdering : undefined}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          {status === 'loading' && (
            <>
              <Loader2 className="h-16 w-16 text-primary animate-spin mx-auto" />
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  Processing Payment...
                </h1>
                <p className="text-muted-foreground">
                  Please wait while we confirm your payment.
                </p>
              </div>
            </>
          )}
          
          {status === 'error' && (
            <>
              <XCircle className="h-16 w-16 text-red-500 mx-auto" />
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {orderingResults?.error ? 'Postcard Ordering Failed' : 'Payment Failed'}
                </h1>
                <p className="text-muted-foreground">
                  {orderingResults?.error 
                    ? 'Your payment was successful, but we had trouble ordering your postcards.'
                    : 'Redirecting you back to try again...'
                  }
                </p>
                {orderingResults?.error && retryAttempts < 3 && (
                  <Button onClick={retryPostcardOrdering} className="mt-4">
                    Retry Ordering ({retryAttempts}/3)
                  </Button>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      </div>
    </div>
  );
}