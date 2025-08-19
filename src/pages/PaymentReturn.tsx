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

  // Validate if postcard data is complete with detailed logging
  const validatePostcardData = (data: any) => {
    console.log('=== VALIDATING POSTCARD DATA ===');
    console.log('Raw data:', data);
    
    if (!data) {
      console.log('❌ Validation failed: No data provided');
      return false;
    }
    
    console.log('✅ Data exists, checking userInfo...');
    console.log('userInfo:', data.userInfo);
    
    if (!data.userInfo) {
      console.log('❌ Validation failed: Missing userInfo');
      return false;
    }
    
    if (!data.userInfo.streetAddress) {
      console.log('❌ Validation failed: Missing userInfo.streetAddress');
      console.log('Available userInfo fields:', Object.keys(data.userInfo));
      return false;
    }
    
    if (!data.userInfo.fullName) {
      console.log('❌ Validation failed: Missing userInfo.fullName');
      console.log('Available userInfo fields:', Object.keys(data.userInfo));
      return false;
    }
    
    console.log('✅ userInfo valid, checking representative...');
    console.log('representative:', data.representative);
    
    if (!data.representative) {
      console.log('❌ Validation failed: Missing representative');
      return false;
    }
    
    if (!data.representative.name) {
      console.log('❌ Validation failed: Missing representative.name');
      console.log('Available representative fields:', Object.keys(data.representative));
      return false;
    }
    
    console.log('✅ representative valid, checking finalMessage...');
    console.log('finalMessage:', data.finalMessage);
    
    if (!data.finalMessage) {
      console.log('❌ Validation failed: Missing finalMessage');
      return false;
    }
    
    console.log('✅ All validation checks passed!');
    return true;
  };

  // Migrate data from localStorage to AppContext if needed
  const migrateDataToAppContext = () => {
    console.log('=== MIGRATING DATA FROM LOCALSTORAGE ===');
    const storedData = localStorage.getItem('postcardData');
    console.log('Raw localStorage data:', storedData);
    
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        console.log('Parsed localStorage data:', parsedData);
        
        if (validatePostcardData(parsedData)) {
          console.log('✅ localStorage data is valid, migrating to AppContext');
          return parsedData;
        } else {
          console.log('❌ localStorage data failed validation');
        }
      } catch (error) {
        console.error('❌ Failed to parse localStorage data:', error);
      }
    } else {
      console.log('❌ No data found in localStorage');
    }
    return null;
  };

  // Get postcard data with fallback logic
  const getPostcardData = () => {
    console.log('=== GETTING POSTCARD DATA ===');
    console.log('Current AppContext state:', state.postcardData);
    
    // First try AppContext
    if (validatePostcardData(state.postcardData)) {
      console.log('✅ Using postcard data from AppContext');
      return state.postcardData;
    } else {
      console.log('❌ AppContext data invalid, trying localStorage migration...');
    }
    
    // Fallback to localStorage migration
    const migratedData = migrateDataToAppContext();
    if (migratedData) {
      console.log('✅ Using migrated data from localStorage');
      return migratedData;
    }
    
    console.log('❌ No valid data found anywhere');
    return null;
  };

  const orderPostcards = async () => {
    try {
      setStatus('ordering');
      console.log('Starting postcard ordering process...');
      
      const postcardData = getPostcardData();
      
      if (!postcardData) {
        console.log('No valid postcard data found, clearing localStorage and redirecting...');
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
      
      console.log('Ordering postcard with data:', postcardData);
      
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
      // Payment was successful, start postcard ordering immediately
      setStartTime(Date.now());
      setStatus('ordering');
      orderPostcards();
    } else {
      // No session ID means payment failed
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