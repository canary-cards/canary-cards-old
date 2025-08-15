import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { RobotLoadingScreen } from '@/components/RobotLoadingScreen';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export default function PaymentReturn() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'ordering' | 'success' | 'error'>('loading');
  const [orderingResults, setOrderingResults] = useState<any>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const { toast } = useToast();

  const orderPostcards = async () => {
    try {
      setStatus('ordering');
      console.log('Starting postcard ordering process...');
      
      const storedData = localStorage.getItem('postcardData');
      if (!storedData) {
        throw new Error('No postcard data found');
      }
      
      const postcardData = JSON.parse(storedData);
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
        setStatus('success');
        
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
  if (status === 'ordering' || status === 'success') {
    return (
      <RobotLoadingScreen 
        status={status === 'ordering' ? 'loading' : 'success'}
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