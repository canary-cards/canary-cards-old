import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAppContext } from '../context/AppContext';
import { EmbeddedCheckout } from '../components/EmbeddedCheckout';
import { ArrowLeft, CreditCard, Shield, Clock, Heart, Apple } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export function Checkout() {
  const { state, dispatch } = useAppContext();
  
  const [email, setEmail] = useState(state.postcardData.email || '');
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  
  const userInfo = state.postcardData.userInfo;
  const sendOption = state.postcardData.sendOption || 'single';
  const senators = state.postcardData.senators || [];

  const pricing = {
    single: 5.00,
    double: 8.00,
    triple: 11.00
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (emailError && validateEmail(value)) {
      setEmailError('');
    }
  };

  const handlePayment = async () => {
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    setIsProcessing(true);
    setEmailError('');
    
    try {
      // Call Stripe payment function
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          sendOption,
          email,
          fullName: userInfo?.fullName
        }
      });
      
      if (error) throw error;

      // Update app state 
      dispatch({
        type: 'UPDATE_POSTCARD_DATA',
        payload: {
          email
        }
      });

      // Store the complete postcard data to localStorage for access after payment
      const completePostcardData = {
        ...state.postcardData,
        email,
        senators
      };
      localStorage.setItem('postcardData', JSON.stringify(completePostcardData));

      // Show embedded checkout
      setClientSecret(data.client_secret);
      setShowCheckout(true);
    } catch (error) {
      console.error('Payment error:', error);
      setEmailError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBackFromCheckout = () => {
    setShowCheckout(false);
    setClientSecret(null);
  };

  const goBack = () => {
    dispatch({ type: 'SET_STEP', payload: 5 }); // Go back to review card screen
  };

  // Show embedded checkout on separate screen if client secret is available
  if (showCheckout && clientSecret) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 pt-20 pb-8 max-w-2xl">
          <EmbeddedCheckout 
            clientSecret={clientSecret}
            onBack={handleBackFromCheckout}
            sendOption={sendOption}
            amount={pricing[sendOption]}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-20 pb-8 max-w-2xl">
        <Card className="card-warm">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Complete Your Order
              </h1>
              <h3 className="subtitle text-base">
                Secure checkout for your postcard delivery
              </h3>
            </div>

            <div className="space-y-6">
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">Email for tracking details</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your@email.com" 
                  value={email} 
                  onChange={e => handleEmailChange(e.target.value)} 
                  className="input-warm" 
                />
                {emailError && <p className="text-sm text-destructive">{emailError}</p>}
              </div>

              {/* Security & Delivery Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Shield className="w-4 h-4" />
                  <span>Secure payment processing</span>
                </div>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <Clock className="w-4 h-4" />
                  <span>Sent within 3 business days</span>
                </div>
              </div>

              {/* Payment Button */}
              <div className="space-y-4">
                <Button 
                  onClick={handlePayment} 
                  disabled={!email || !validateEmail(email) || isProcessing} 
                  variant="spotlight" 
                  className="w-full h-12 sm:h-14 button-warm text-sm sm:text-base md:text-lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2 sm:mr-3" />
                      <span className="truncate">Loading checkout...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="truncate">Pay ${pricing[sendOption]}</span>
                    </>
                  )}
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    Payments processed securely — supports <Apple className="w-4 h-4 inline mx-1" /> Apple Pay and Google Pay
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You'll receive an email confirmation as soon as your order is processed.
                  </p>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex gap-2 sm:gap-4 pt-4 border-t">
                <Button 
                  type="button" 
                  variant="secondary" 
                  onClick={goBack} 
                  className="button-warm flex-shrink-0 px-3 sm:px-4"
                >
                  <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="text-sm sm:text-base">Back</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}