import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAppContext } from '../../context/AppContext';
import { ProgressIndicator } from '../ProgressIndicator';
import { ArrowLeft, Mail, CreditCard, Shield, Clock, Heart, Users, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { lookupSenators } from '@/services/geocodio';
import { Representative } from '@/types';

export function PreviewSendScreen() {
  const { state, dispatch } = useAppContext();
  const [sendOption, setSendOption] = useState<'single' | 'triple'>('single');
  const [email, setEmail] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [senators, setSenators] = useState<Representative[]>([]);
  const [loadingSenators, setLoadingSenators] = useState(false);

  const singlePrice = 4.99;
  const triplePrice = 11.99;
  const savings = (singlePrice * 3) - triplePrice;

  const rep = state.postcardData.representative;
  const userInfo = state.postcardData.userInfo;
  const finalMessage = state.postcardData.finalMessage;

  // Fetch senators when component mounts
  useEffect(() => {
    const fetchSenators = async () => {
      if (userInfo?.state) {
        setLoadingSenators(true);
        try {
          const stateSenators = await lookupSenators(userInfo.state);
          setSenators(stateSenators);
        } catch (error) {
          console.error('Failed to fetch senators:', error);
        } finally {
          setLoadingSenators(false);
        }
      }
    };

    fetchSenators();
  }, [userInfo?.state]);

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
        body: { sendOption, email }
      });

      if (error) throw error;

      // Update app state before redirecting
      dispatch({ 
        type: 'UPDATE_POSTCARD_DATA', 
        payload: { sendOption, email }
      });

      // Redirect to Stripe checkout
      window.open(data.url, '_blank');
    } catch (error) {
      console.error('Payment error:', error);
      setEmailError('Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const goBack = () => {
    dispatch({ type: 'SET_STEP', payload: 5 });
  };

  // All representatives for display
  const allReps = rep ? [rep, ...senators] : senators;

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

            {/* Representatives Cards */}
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-4">
                <Zap className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Amplify your impact</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Send your message to all your representatives to maximize your voice in government
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {rep && (
                  <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardContent className="p-4 text-center">
                      <Avatar className="w-12 h-12 mx-auto mb-2">
                        <AvatarImage src={rep.photo} alt={rep.name} />
                        <AvatarFallback className="bg-primary/10 text-primary text-sm">
                          {rep.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <h4 className="font-medium text-sm text-foreground">{rep.name}</h4>
                      <p className="text-xs text-muted-foreground">House Rep</p>
                      <Badge variant="outline" className="text-xs mt-1">
                        {rep.party}
                      </Badge>
                    </CardContent>
                  </Card>
                )}
                
                {loadingSenators ? (
                  <>
                    <Card className="bg-gradient-to-br from-muted/20 to-muted/40">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-2 animate-pulse" />
                        <div className="h-4 bg-muted rounded mx-auto mb-1 animate-pulse" />
                        <div className="h-3 bg-muted rounded w-16 mx-auto animate-pulse" />
                      </CardContent>
                    </Card>
                    <Card className="bg-gradient-to-br from-muted/20 to-muted/40">
                      <CardContent className="p-4 text-center">
                        <div className="w-12 h-12 bg-muted rounded-full mx-auto mb-2 animate-pulse" />
                        <div className="h-4 bg-muted rounded mx-auto mb-1 animate-pulse" />
                        <div className="h-3 bg-muted rounded w-16 mx-auto animate-pulse" />
                      </CardContent>
                    </Card>
                  </>
                ) : (
                  senators.map((senator) => (
                    <Card key={senator.id} className="bg-gradient-to-br from-secondary/5 to-secondary/10 border-secondary/20">
                      <CardContent className="p-4 text-center">
                        <Avatar className="w-12 h-12 mx-auto mb-2">
                          <AvatarImage src={senator.photo} alt={senator.name} />
                          <AvatarFallback className="bg-secondary/10 text-secondary text-sm">
                            {senator.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <h4 className="font-medium text-sm text-foreground">{senator.name}</h4>
                        <p className="text-xs text-muted-foreground">Senator</p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {senator.party}
                        </Badge>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
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