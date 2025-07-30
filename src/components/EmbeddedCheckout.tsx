import React, { useEffect, useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Loader2 } from 'lucide-react';

const stripePromise = loadStripe('pk_test_51Rm04GLqBC9dKThjLjUe7M1Cd8oIgW3IAFBwI1QYk3GsoBLUCu9SfW79On3wjkvst8OJtKpyLPhwjtyqBtonVg5O00BztMUEXj');

interface EmbeddedCheckoutProps {
  clientSecret: string;
  onBack: () => void;
  sendOption: 'single' | 'triple';
  amount: number;
}

export function EmbeddedCheckout({ clientSecret, onBack, sendOption, amount }: EmbeddedCheckoutProps) {
  const [checkout, setCheckout] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeCheckout = async () => {
      let stripe = null;
      try {
        console.log('EmbeddedCheckout: Starting initialization with clientSecret:', clientSecret ? 'present' : 'missing');
        
        stripe = await stripePromise;
        if (!stripe) {
          throw new Error('Stripe failed to load');
        }
        console.log('EmbeddedCheckout: Stripe loaded successfully');

        if (!clientSecret) {
          throw new Error('Client secret is missing');
        }

        console.log('EmbeddedCheckout: Initializing embedded checkout...');
        const checkoutInstance = await stripe.initEmbeddedCheckout({
          clientSecret,
        });
        console.log('EmbeddedCheckout: Checkout instance created successfully');

        setCheckout(checkoutInstance);
        checkoutInstance.mount('#embedded-checkout');
        console.log('EmbeddedCheckout: Checkout mounted to DOM');
        setLoading(false);
      } catch (err: any) {
        console.error('EmbeddedCheckout: Failed to initialize Stripe checkout:', err);
        console.error('EmbeddedCheckout: Error details:', {
          message: err.message,
          clientSecret: clientSecret ? 'present' : 'missing',
          stripeLoaded: !!stripe
        });
        setError(`Failed to load payment form: ${err.message}`);
        setLoading(false);
      }
    };

    console.log('EmbeddedCheckout: useEffect triggered, clientSecret:', clientSecret ? 'present' : 'missing');
    if (clientSecret) {
      initializeCheckout();
    } else {
      console.log('EmbeddedCheckout: No clientSecret provided, skipping initialization');
    }

    return () => {
      if (checkout) {
        console.log('EmbeddedCheckout: Unmounting checkout');
        checkout.unmount();
      }
    };
  }, [clientSecret]);

  if (loading) {
    return (
      <Card className="card-warm">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <h2 className="text-xl font-semibold">Loading Payment Form...</h2>
            <p className="text-muted-foreground">Setting up secure payment for your postcards</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="card-warm">
        <CardContent className="p-8">
          <div className="text-center space-y-4">
            <div className="text-destructive text-2xl">⚠️</div>
            <h2 className="text-xl font-semibold">Payment Error</h2>
            <p className="text-muted-foreground">{error}</p>
            <Button onClick={onBack} variant="outline" className="mt-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go Back
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="card-warm">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <h2 className="text-xl font-semibold mb-2">Complete Your Payment</h2>
            <p className="text-muted-foreground mb-4">
              {sendOption === 'single' ? 'Single postcard' : 'Triple postcard package'} - ${amount}
            </p>
          </div>
          
          {/* Stripe Embedded Checkout will mount here */}
          <div id="embedded-checkout" className="min-h-[400px]" />
          
          <div className="mt-6 pt-4 border-t">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onBack}
              className="button-warm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Review
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}