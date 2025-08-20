import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { LawmakerSelectCard } from '@/components/ui/lawmaker-select-card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAppContext } from '../../context/AppContext';
import { EmbeddedCheckout } from '../EmbeddedCheckout';
import { ArrowLeft, Apple, CreditCard, Shield, Clock } from 'lucide-react';
import { lookupRepresentativesAndSenators } from '@/services/geocodio';
import { Representative } from '@/types';
import { supabase } from '@/integrations/supabase/client';
export function CheckoutScreen() {
  const {
    state,
    dispatch
  } = useAppContext();
  const [email, setEmail] = useState(state.postcardData.email || '');
  const [emailError, setEmailError] = useState('');
  const [senators, setSenators] = useState<Representative[]>([]);
  const [loadingSenators, setLoadingSenators] = useState(false);
  const [selectedSenators, setSelectedSenators] = useState<boolean[]>([true, false]); // Senator 1 checked by default
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const rep = state.postcardData.representative;
  const userInfo = state.postcardData.userInfo;

  // Fetch senators when component mounts
  useEffect(() => {
    const fetchSenatorsFromZip = async () => {
      if (userInfo?.zipCode) {
        setLoadingSenators(true);
        try {
          const {
            senators: stateSenators
          } = await lookupRepresentativesAndSenators(userInfo.zipCode);
          setSenators(stateSenators);
        } catch (error) {
          console.error('Failed to fetch senators:', error);
        } finally {
          setLoadingSenators(false);
        }
      }
    };
    fetchSenatorsFromZip();
  }, [userInfo?.zipCode]);
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
  const handleSenatorToggle = (index: number, checked: boolean) => {
    const newSelectedSenators = [...selectedSenators];
    newSelectedSenators[index] = checked;
    setSelectedSenators(newSelectedSenators);
  };
  const getSelectedSenatorsCount = () => {
    return selectedSenators.filter(Boolean).length;
  };
  const getTotalPrice = () => {
    const senatorCount = getSelectedSenatorsCount();
    return 5.00 + senatorCount * 3.00;
  };
  const getSendOption = (): 'single' | 'double' | 'triple' => {
    const senatorCount = getSelectedSenatorsCount();
    if (senatorCount === 0) return 'single';
    if (senatorCount === 1) return 'double';
    return 'triple';
  };
  const handlePayment = async () => {
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setIsProcessing(true);
    setEmailError('');
    try {
      const sendOption = getSendOption();
      const selectedSenatorsList = senators.filter((_, index) => selectedSenators[index]);

      // Call Stripe payment function with complete postcard data
      const {
        data,
        error
      } = await supabase.functions.invoke('create-payment', {
        body: {
          sendOption,
          email,
          fullName: userInfo?.fullName,
          postcardData: {
            userInfo,
            representative: rep,
            senators: selectedSenatorsList,
            finalMessage: state.postcardData.finalMessage,
            sendOption,
            email
          }
        }
      });
      if (error) throw error;

      // Update app state 
      dispatch({
        type: 'UPDATE_POSTCARD_DATA',
        payload: {
          sendOption,
          email,
          senators: selectedSenatorsList
        }
      });

      // Store the complete postcard data to localStorage for access after payment
      const completePostcardData = {
        ...state.postcardData,
        sendOption,
        email,
        senators: selectedSenatorsList
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
    dispatch({
      type: 'SET_STEP',
      payload: 5
    }); // Go back to review card screen
  };

  // Show embedded checkout on separate screen if client secret is available
  if (showCheckout && clientSecret) {
    return <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 pt-20 pb-8 max-w-2xl">
          <EmbeddedCheckout clientSecret={clientSecret} onBack={handleBackFromCheckout} sendOption={getSendOption()} amount={getTotalPrice()} />
        </div>
      </div>;
  }
  return <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 pt-20 pb-8 max-w-2xl">
          <Card className="card-warm">
            <CardContent className="p-8">
              {/* Header Section */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-2">You've created a masterful postcard</h1>
                <h3 className="subtitle text-base">Let's get it out into the world</h3>
              </div>

              {/* Instruction Line */}
              

              <div className="space-y-4">
                {/* Lawmaker Cards */}
                <div className="space-y-3">
                  {/* Representative Section */}
                  {rep && <div className="space-y-4">
                      <div className="px-1">
                        <p className="text-sm font-medium text-foreground leading-tight mb-3">
                          Your representative is directly accountable to your district.
                        </p>
                      </div>
                      <LawmakerSelectCard lawmaker={{
                    ...rep,
                    type: 'Representative'
                  }} isSelected={true} isDisabled={true} price="$5" valueText="" supportText="" showTooltip={false} />
                    </div>}

                  {/* Senators Section */}
                  <div className="space-y-4">
                    <div className="px-1">
                      <p className="text-sm font-medium text-foreground leading-tight mb-3">Your two senators represent your whole state.</p>
                    </div>
                    <div className="space-y-3">
                      {loadingSenators ? <>
                          {/* Loading skeleton for senators */}
                          {[0, 1].map(index => <Card key={index} className="bg-gradient-to-br from-muted/20 to-muted/40">
                              <CardContent className="p-4">
                                <div className="space-y-3">
                                  <div className="flex items-start gap-4">
                                    <div className="w-12 h-12 bg-muted rounded-lg animate-pulse" />
                                    <div className="flex-1 space-y-2">
                                      <div className="h-4 bg-muted rounded animate-pulse" />
                                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <div className="w-12 h-5 bg-muted rounded animate-pulse" />
                                      <div className="w-4 h-4 bg-muted rounded animate-pulse" />
                                    </div>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="h-3 bg-muted rounded animate-pulse" />
                                    <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                                  </div>
                                </div>
                              </CardContent>
                            </Card>)}
                        </> : senators.slice(0, 2).map((senator, index) => <LawmakerSelectCard key={senator.id} lawmaker={{
                      ...senator,
                      type: 'Senator'
                    }} isSelected={selectedSenators[index]} price="$3" valueText="" supportText="" onSelectionChange={checked => handleSenatorToggle(index, checked)} showTooltip={false} />)}
                    </div>
                  </div>
                </div>

                {/* Address reassurance */}
                {senators.length > 0 && !loadingSenators && <div className="text-center">
                    <p className="text-sm text-muted-foreground">✓ We’ll add the correct senator addresses automatically.</p>
                  </div>}
              </div>

              <div className="space-y-6">
                {/* Order Summary - Sticky on mobile */}
                <Card className="bg-primary/5 border-primary/20 sticky top-4 z-10">
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">Your order:</span>
                        <span className="text-sm text-muted-foreground">
                          {getSendOption() === 'single' && '1 postcard'}
                          {getSendOption() === 'double' && '2 postcards'}
                          {getSendOption() === 'triple' && '3 postcards'}
                        </span>
                      </div>
                      <span className="font-bold text-xl text-primary">
                        ${getTotalPrice().toFixed(2)}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Social Proof */}
                <div className="text-center py-2">
                  <p className="text-sm text-muted-foreground">You can choose just your Rep — most send to all three.</p>
                </div>

                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email">Email for tracking details</Label>
                  <Input id="email" type="email" placeholder="your@email.com" value={email} onChange={e => handleEmailChange(e.target.value)} className="input-warm" />
                  {emailError && <p className="text-sm text-destructive">{emailError}</p>}
                </div>

                {/* Security & Delivery Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Shield className="w-4 h-4" />
                    <span>Secure payment processing</span>
                  </div>
                  <div className="flex items-center space-x-2 text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>Sent within 3 business days</span>
                  </div>
                </div>

                {/* Primary CTA */}
                <div className="space-y-4">
                  <Button onClick={handlePayment} disabled={!email || !validateEmail(email) || isProcessing} variant="spotlight" className="w-full h-12 sm:h-14 button-warm text-sm sm:text-base md:text-lg">
                    {isProcessing ? <>
                        <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2 sm:mr-3" />
                        <span className="truncate">Loading checkout...</span>
                      </> : <>
                        <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 mr-2 sm:mr-3 flex-shrink-0" />
                        <span className="truncate">Pay ${getTotalPrice().toFixed(2)}</span>
                      </>}
                  </Button>
                  
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground mb-1">
                      Payments processed securely — supports <Apple className="w-4 h-4 inline mx-1" /> Apple Pay and Google Pay
                    </p>
                    <p className="text-xs text-muted-foreground">
                      You'll receive an email confirmation as soon as your order is processed.
                    </p>
                  </div>
                </div>

                {/* Footer reassurance */}
                <p className="text-sm text-muted-foreground text-center">
                  We include the details staff look for to process constituent mail swiftly.
                </p>

                {/* Navigation */}
                <div className="flex gap-2 sm:gap-4 pt-4 border-t">
                  <Button type="button" variant="secondary" onClick={goBack} className="button-warm flex-shrink-0 px-3 sm:px-4">
                    <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                    <span className="text-sm sm:text-base">Back</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </TooltipProvider>;
}