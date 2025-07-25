import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '../../context/AppContext';
import { ProgressIndicator } from '../ProgressIndicator';
import { ArrowLeft, Mail, CreditCard, Shield, Clock, Heart } from 'lucide-react';

export function PreviewSendScreen() {
  const { state, dispatch } = useAppContext();
  const [sendOption, setSendOption] = useState<'single' | 'triple'>('single');
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailError, setEmailError] = useState('');

  const singlePrice = 4.99;
  const triplePrice = 11.99;
  const savings = (singlePrice * 3) - triplePrice;

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
    
    // Mock payment processing
    setTimeout(() => {
      dispatch({ 
        type: 'UPDATE_POSTCARD_DATA', 
        payload: { sendOption, email }
      });
      
      // In real app, would integrate with Stripe here
      setIsProcessing(false);
      
      // Navigate to success screen
      dispatch({ type: 'SET_STEP', payload: 7 });
    }, 3000);
  };

  const goBack = () => {
    dispatch({ type: 'SET_STEP', payload: 5 });
  };

  const rep = state.postcardData.representative;
  const userInfo = state.postcardData.userInfo;
  const finalMessage = state.postcardData.finalMessage;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <ProgressIndicator currentStep={5} totalSteps={5} />
        
        <Card className="card-warm">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Review Your Card
              </h1>
              <p className="text-muted-foreground">
                We'll send this card to a robot that will use real pen and paper to write it
              </p>
            </div>

            {/* Postcard Preview */}
            <div className="mb-8">
              <Card className="bg-gradient-to-br from-card to-muted/30 border-2">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left side - Return address */}
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{userInfo?.firstName} {userInfo?.lastName}</p>
                      <p>{userInfo?.streetAddress}</p>
                      <p>{userInfo?.city}, {userInfo?.state} {userInfo?.zipCode}</p>
                    </div>
                    
                    {/* Right side - Representative address */}
                    <div className="space-y-1 text-sm">
                      <p className="font-medium">{rep?.name}</p>
                      <p>U.S. House of Representatives</p>
                      <p>Washington, DC 20515</p>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-background/80 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Message (handwritten style):</p>
                    <div className="text-sm leading-relaxed" style={{ fontFamily: 'Georgia, serif' }}>
                      {finalMessage}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Send Options */}
            <div className="space-y-6">
              <div>
                <h3 className="font-semibold mb-4">Choose your send option:</h3>
                <RadioGroup value={sendOption} onValueChange={(value: 'single' | 'triple') => setSendOption(value)}>
                  <div className="space-y-3">
                    <Card className={`cursor-pointer transition-all ${sendOption === 'single' ? 'ring-2 ring-primary' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="single" id="single" />
                          <div className="flex-1">
                            <Label htmlFor="single" className="cursor-pointer">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Single Postcard</span>
                                <span className="font-bold text-lg">${singlePrice}</span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Send to {rep?.name}
                              </p>
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className={`cursor-pointer transition-all ${sendOption === 'triple' ? 'ring-2 ring-primary' : ''}`}>
                      <CardContent className="p-4">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="triple" id="triple" />
                          <div className="flex-1">
                            <Label htmlFor="triple" className="cursor-pointer">
                              <div className="flex items-center justify-between">
                                <span className="font-medium">Triple Postcard Package</span>
                                <div className="text-right">
                                  <span className="font-bold text-lg">${triplePrice}</span>
                                  <Badge variant="secondary" className="ml-2">
                                    Save ${savings.toFixed(2)}
                                  </Badge>
                                </div>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Send to all 3 of your representatives (House Rep + 2 Senators)
                              </p>
                            </Label>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </RadioGroup>
              </div>

              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">Email for tracking details</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={(e) => handleEmailChange(e.target.value)}
                  className="input-warm"
                />
                {emailError && (
                  <p className="text-sm text-destructive">{emailError}</p>
                )}
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
                  className="w-full h-14 button-warm text-lg"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-3" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-5 h-5 mr-3" />
                      {sendOption === 'single' 
                        ? `Send My Postcard - $${singlePrice}` 
                        : `Send My 3 Postcards - $${triplePrice}`
                      }
                    </>
                  )}
                </Button>
                
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-2">
                    <Heart className="w-4 h-4 inline mr-1" />
                    Who knew saving democracy could be so easy?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Supports Apple Pay, Google Pay, and all major credit cards
                  </p>
                </div>
              </div>

              <div className="flex gap-4 pt-4 border-t">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  className="button-warm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}