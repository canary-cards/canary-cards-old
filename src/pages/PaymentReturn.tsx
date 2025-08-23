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
    console.log('🔍 Validating postcard data:', data);
    
    if (!data) {
      console.log('❌ No data provided');
      return false;
    }
    
    // Check userInfo
    if (!data.userInfo) {
      console.log('❌ Missing userInfo');
      return false;
    }
    
    if (!data.userInfo.fullName) {
      console.log('❌ Missing userInfo.fullName');
      return false;
    }
    
    if (!data.userInfo.streetAddress) {
      console.log('❌ Missing userInfo.streetAddress');
      return false;
    }
    
    // Check representative
    if (!data.representative) {
      console.log('❌ Missing representative');
      return false;
    }
    
    if (!data.representative.name) {
      console.log('❌ Missing representative.name');
      return false;
    }
    
    // Check message
    if (!data.finalMessage) {
      console.log('❌ Missing finalMessage');
      return false;
    }
    
    console.log('✅ All validation checks passed');
    return true;
  };

  // Get postcard data from AppContext (which now auto-restores from storage)
  const getPostcardData = () => {
    console.log('🔍 Getting postcard data from AppContext...');
    console.log('Current AppContext state:', state.postcardData);
    
    if (validatePostcardData(state.postcardData)) {
      console.log('✅ Using valid data from AppContext');
      return state.postcardData;
    }
    
    console.log('❌ No valid data available');
    return null;
  };

  const orderPostcardsWithData = async (postcardData: any) => {
    try {
      console.log('🔄 [STEP 11] Starting postcard ordering process...');
      setStatus('ordering');
      
      console.log('📊 [DEBUG] Current state before ordering:', {
        currentStep: state.currentStep,
        postcardDataKeys: Object.keys(state.postcardData || {}),
        hasUserInfo: !!state.postcardData?.userInfo,
        hasRepresentative: !!state.postcardData?.representative,
        hasFinalMessage: !!state.postcardData?.finalMessage
      });
      
      if (!postcardData || !validatePostcardData(postcardData)) {
        console.log('❌ No valid postcard data found');
        
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
      
      console.log('✅ [STEP 12] Using valid postcard data for ordering');
      
      console.log('🔄 [STEP 13] Calling send-postcard function...');
      const { data, error } = await supabase.functions.invoke('send-postcard', {
        body: { postcardData }
      });
      
      console.log('📝 [STEP 14] Send-postcard function response:', {
        hasData: !!data,
        hasError: !!error,
        data: data,
        error: error
      });
      
      if (error) {
        console.error('❌ [STEP 15] Supabase function error:', error);
        throw error;
      }
      
      console.log('✅ [STEP 15] Postcard ordering completed successfully');
      setOrderingResults(data);
      
      if (data.success) {
        console.log('🎉 [STEP 16] All postcards sent successfully!');
        console.log('📊 [DEBUG] Success data:', {
          totalSent: data.summary?.totalSent,
          totalFailed: data.summary?.totalFailed,
          startTime: startTime,
          currentTime: Date.now(),
          elapsed: Date.now() - startTime
        });
        
        // Ensure minimum 4 seconds before navigating
        const elapsed = Date.now() - startTime;
        const minTime = 4000; // 4 seconds
        const remainingTime = Math.max(0, minTime - elapsed);
        
        console.log(`⏰ [STEP 17] Waiting ${remainingTime}ms before navigation to payment-success`);
        
        setTimeout(() => {
          console.log('🔄 [STEP 18] Navigating to /payment-success...');
          console.log('📊 [DEBUG] Navigation data:', {
            sessionId: searchParams.get('session_id'),
            orderingResults: data
          });
          
          navigate('/payment-success', { 
            state: { 
              sessionId: searchParams.get('session_id'),
              orderingResults: data 
            }
          });
        }, remainingTime);
      } else {
        console.log('⚠️ [STEP 16] Some postcards failed to send');
        setStatus('error');
        toast({
          title: "Some postcards failed to order",
          description: `${data.summary.totalSent} ordered, ${data.summary.totalFailed} failed.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to order postcards:', error);
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
      console.log('🔍 [STEP 1] Starting payment verification for session:', sessionId);
      console.log('📊 [DEBUG] Current app state:', {
        currentStep: state.currentStep,
        hasPostcardData: !!state.postcardData,
        postcardDataKeys: Object.keys(state.postcardData || {})
      });
      
      // Verify payment with Stripe
      console.log('🔄 [STEP 2] Calling verify-payment function...');
      const { data: verificationResult, error: verificationError } = await supabase.functions.invoke('verify-payment', {
        body: { sessionId }
      });
      
      console.log('📝 [STEP 3] Verification function response:', {
        hasData: !!verificationResult,
        hasError: !!verificationError,
        data: verificationResult,
        error: verificationError
      });
      
      if (verificationError) {
        console.error('❌ [STEP 4] Payment verification error:', verificationError);
        throw new Error('Failed to verify payment status');
      }
      
      if (!verificationResult) {
        console.error('❌ [STEP 4] No verification result received');
        throw new Error('No verification response received');
      }
      
      console.log('🔍 [STEP 4] Checking verification result success:', verificationResult.success);
      
      if (!verificationResult.success) {
        console.log('❌ [STEP 5] Payment verification failed - redirecting to canceled');
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
      
      console.log('✅ [STEP 6] Payment verified successfully, checking for postcard data');
      console.log('📊 [DEBUG] Verification result details:', {
        success: verificationResult.success,
        paymentStatus: verificationResult.paymentStatus,
        sessionStatus: verificationResult.sessionStatus,
        hasPostcardData: !!verificationResult.postcardData,
        postcardDataKeys: verificationResult.postcardData ? Object.keys(verificationResult.postcardData) : []
      });
      
      // Use postcard data from payment session metadata
      if (verificationResult.postcardData) {
        console.log('✅ [STEP 7] Found postcard data in payment session:', verificationResult.postcardData);
        console.log('🔄 [STEP 8] Updating app state with postcard data...');
        
        // Update app state with the postcard data from payment session
        dispatch({ 
          type: 'UPDATE_POSTCARD_DATA', 
          payload: verificationResult.postcardData 
        });
        
        console.log('✅ [STEP 9] App state updated successfully');
        console.log('📊 [DEBUG] New app state after update:', {
          currentStep: state.currentStep,
          postcardDataKeys: Object.keys(verificationResult.postcardData)
        });
        
        console.log('🔄 [STEP 10] Setting status to ordering and starting postcard process...');
        setStatus('ordering');
        
        // Start ordering immediately with session data (pass data directly to avoid state timing issues)
        orderPostcardsWithData(verificationResult.postcardData);
      } else {
        console.log('❌ [STEP 7] No postcard data found in payment session');
        console.log('📊 [DEBUG] Full verification result:', verificationResult);
        setStatus('error');
        toast({
          title: "Session data missing",
          description: "Unable to find your postcard data. Please start over.",
          variant: "destructive",
        });
        setTimeout(() => {
          console.log('🔄 [REDIRECT] Navigating to /onboarding due to missing postcard data');
          navigate('/onboarding');
        }, 3000);
        return;
      }
      
    } catch (error) {
      console.error('Payment verification failed:', error);
      setStatus('error');
      toast({
        title: "Payment verification failed",
        description: "Unable to verify payment. Please try again or contact support.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    console.log('🚀 [INITIAL] PaymentReturn component mounted');
    console.log('📊 [DEBUG] URL search params:', window.location.search);
    
    const sessionId = searchParams.get('session_id');
    console.log('🔍 [INITIAL] Session ID from URL:', sessionId);
    
    if (sessionId) {
      console.log('💳 [INITIAL] Session ID found, starting verification process...');
      toast({
        title: "Debug Mode Active",
        description: "Check console for detailed flow tracking",
        variant: "default",
      });
      setStartTime(Date.now());
      setStatus('loading');
      console.log('🔄 [INITIAL] Calling verifyPaymentAndOrder...');
      verifyPaymentAndOrder(sessionId);
    } else {
      console.log('❌ [INITIAL] No session ID found, redirecting to canceled page');
      setStatus('error');
      setTimeout(() => {
        console.log('🔄 [REDIRECT] Navigating to /payment-canceled due to missing session ID');
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