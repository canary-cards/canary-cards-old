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
  const [selectedSenators, setSelectedSenators] = useState<boolean[]>([true, true]); // Both senators checked by default
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
          {/* Header Section - Outside of cards */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">Let's get your masterful postcard out the door</h1>
            <h3 className="subtitle text-base">You have three congresspeople in D.C. Most send to all of them.</h3>
          </div>

          {/* Lawmaker Selection Card */}
          <Card className="card-warm mb-6">
            <CardContent className="p-8">
              <div className="space-y-4">
                {/* Lawmaker Cards */}
                <div className="space-y-6">
                  {/* Representative Section */}
                  {rep && <div className="space-y-4">
                      <Label className="block">
                        Your representative is directly accountable to your district.
                      </Label>
                      <LawmakerSelectCard lawmaker={{
                    ...rep,
                    type: 'Representative'
                  }} isSelected={true} isDisabled={true} price="$5" valueText="" supportText="" showTooltip={false} />
                    </div>}

                  {/* Senators Section */}
                  <div className="space-y-4">
                    <Label className="block">Your two senators represent your whole state.</Label>
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
                    <p className="text-sm text-muted-foreground">✓ We'll add the correct senator addresses automatically.</p>
                  </div>}
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="bg-white border-[#E8DECF] shadow-[0_2px_6px_rgba(0,0,0,0.12)] mb-6">
            <CardContent className="p-4 md:p-5">
              <Label className="block text-base md:text-lg font-semibold text-primary mb-4">Your Order</Label>
              <div className="space-y-2">
                <div className="text-right">
                  <span>Rep. {rep?.name.split(' ').pop() || 'Representative'} — $5.00</span>
                </div>
                {selectedSenators.map((isSelected, index) => 
                  isSelected && senators[index] ? (
                    <div key={index} className="text-right">
                      <span>Sen. {senators[index].name.split(' ').pop()} — $3.00</span>
                    </div>
                  ) : null
                )}
                <div className="border-t border-[#E8DECF] pt-2 mt-2">
                  <div className="flex justify-between text-lg md:text-xl font-bold text-primary">
                    <span>Total</span>
                    <span>${getTotalPrice().toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-3">
                  Price includes high‑quality postcards, written with real ballpoint pen, plus First‑Class postage and mailing.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payment Card */}
          <Card className="card-warm">
            <CardContent className="p-8">
              <div className="space-y-6">

                {/* 1. Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-primary">Your Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="you@example.com" 
                    value={email} 
                    onChange={e => handleEmailChange(e.target.value)}
                    className="bg-background border-2 border-[#E8DECF] rounded-xl"
                  />
                  <p className="text-sm text-muted-foreground">
                    We'll send your order confirmation here after checkout.
                  </p>
                  {emailError && <p className="text-sm text-destructive">{emailError}</p>}
                </div>

                {/* 2. Payment Options Logos */}
                <div className="flex justify-center items-center gap-6">
                  <img src="/128px-Apple_Pay_logo.svg.png" alt="Apple Pay" className="h-6" />
                  <img src="/128px-Google_Pay_Logo.svg.png" alt="Google Pay" className="h-8" />
                </div>

                {/* 3. Security Assurance Line */}
                <div className="flex justify-center items-center gap-2 text-primary">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm">Secure Checkout with Stripe</span>
                </div>

                {/* 4. Primary CTA Button */}
                <Button 
                  onClick={handlePayment} 
                  disabled={!email || !validateEmail(email) || isProcessing} 
                  variant="spotlight" 
                  className="w-full h-14 text-lg font-medium"
                >
                  {isProcessing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin mr-3" />
                      <span>Loading checkout...</span>
                    </>
                  ) : (
                    <span>Checkout — ${getTotalPrice().toFixed(2)}</span>
                  )}
                </Button>

                {/* 5. Micro-copy */}
                <p className="text-sm text-muted-foreground text-center">
                  You'll receive an email confirmation once your order is processed.
                </p>

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