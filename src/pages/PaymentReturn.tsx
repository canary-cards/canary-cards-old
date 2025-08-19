import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { HamburgerMenu } from '@/components/HamburgerMenu';
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
  const { state } = useAppContext();

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

  const orderPostcards = async () => {
    // Wait for state restoration to complete
    if (state.isRestoring) {
      console.log('⏳ State is still restoring, waiting...');
      return;
    }
    
    try {
      setStatus('ordering');
      console.log('Starting postcard ordering process...');
      
      const postcardData = getPostcardData();
      
      if (!postcardData) {
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
      
      console.log('✅ Using valid postcard data:', postcardData);
      
      const { data, error } = await supabase.functions.invoke('send-postcard', {
        body: { postcardData }
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      console.log('Postcard ordering results:', data);
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
    await orderPostcards();
  };

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    
    if (sessionId) {
      // Payment was successful, wait for state restoration then start ordering
      console.log('💳 Payment successful, preparing to order postcards...');
      setStartTime(Date.now());
      setStatus('ordering');
      
      // Wait for state restoration to complete before ordering
      const checkAndOrder = () => {
        if (!state.isRestoring) {
          console.log('✅ State restoration complete, starting postcard ordering');
          orderPostcards();
        } else {
          console.log('⏳ Still restoring state, checking again in 100ms...');
          setTimeout(checkAndOrder, 100);
        }
      };
      
      checkAndOrder();
    } else {
      // No session ID means payment failed
      setStatus('error');
      setTimeout(() => {
        navigate('/payment-canceled');
      }, 3000);
    }
  }, [searchParams, navigate, state.isRestoring]);

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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      <div className="absolute top-4 right-4 z-10">
        <HamburgerMenu />
      </div>
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
  );
}