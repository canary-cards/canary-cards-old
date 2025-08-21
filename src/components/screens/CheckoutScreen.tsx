import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { BottomSheet, BottomSheetContent, BottomSheetHeader, BottomSheetTitle } from '@/components/ui/bottom-sheet';
import { useAppContext } from '../../context/AppContext';
import { EmbeddedCheckout } from '../EmbeddedCheckout';
import { ArrowLeft, Shield, ChevronDown, ChevronUp } from 'lucide-react';
import { lookupRepresentativesAndSenators } from '@/services/geocodio';
import { Representative } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { useIsMobile } from '@/hooks/use-mobile';
type RecipientSelection = 'rep-only' | 'all-three' | 'custom';
export function CheckoutScreen() {
  const {
    state,
    dispatch
  } = useAppContext();
  const isMobile = useIsMobile(); // Fixed mobile hook import
  const [email, setEmail] = useState(state.postcardData.email || '');
  const [emailError, setEmailError] = useState('');
  const [senators, setSenators] = useState<Representative[]>([]);
  const [loadingSenators, setLoadingSenators] = useState(false);
  const [selection, setSelection] = useState<RecipientSelection>('rep-only'); // Default to "Just your Representative"
  const [customSelection, setCustomSelection] = useState({
    representative: true,
    senator1: false,
    senator2: false
  });
  const [showMixMatch, setShowMixMatch] = useState(false);
  const [isOrderSummaryOpen, setIsOrderSummaryOpen] = useState(!isMobile);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [validationError, setValidationError] = useState('');
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
  const getSelectedRecipients = () => {
    if (selection === 'rep-only') {
      return {
        representative: true,
        senator1: false,
        senator2: false
      };
    } else if (selection === 'all-three') {
      return {
        representative: true,
        senator1: true,
        senator2: true
      };
    } else {
      return customSelection;
    }
  };
  const getSelectedCount = () => {
    const selected = getSelectedRecipients();
    return (selected.representative ? 1 : 0) + (selected.senator1 ? 1 : 0) + (selected.senator2 ? 1 : 0);
  };
  const getTotalPrice = () => {
    const count = getSelectedCount();
    if (count === 3) {
      return 12; // Bundle price with $3 savings
    }
    return count * 5; // $5 each
  };
  const getSendOption = (): 'single' | 'double' | 'triple' => {
    const count = getSelectedCount();
    if (count === 1) return 'single';
    if (count === 2) return 'double';
    return 'triple';
  };
  const handleSelectionChange = (newSelection: RecipientSelection) => {
    setSelection(newSelection);
    setValidationError('');
  };
  const handleCustomSelection = (recipient: keyof typeof customSelection, checked: boolean) => {
    setCustomSelection(prev => ({
      ...prev,
      [recipient]: checked
    }));
  };
  const validateSelection = () => {
    const count = getSelectedCount();
    if (count === 0) {
      setValidationError('Pick at least one recipient.');
      return false;
    }
    setValidationError('');
    return true;
  };
  const getSelectedSenators = () => {
    const selected = getSelectedRecipients();
    const result: Representative[] = [];
    if (selected.senator1 && senators[0]) result.push(senators[0]);
    if (selected.senator2 && senators[1]) result.push(senators[1]);
    return result;
  };
  const handlePayment = async () => {
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    if (!validateSelection()) {
      return;
    }
    setIsProcessing(true);
    setEmailError('');
    try {
      const sendOption = getSendOption();
      const selectedSenatorsList = getSelectedSenators();

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
  return <>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 pt-20 pb-24 max-w-2xl">
          {/* Header Section */}
          <div className="text-center mb-8">
            <h1 className="text-2xl font-display font-bold text-foreground mb-2">Let's get your masterful postcard out the door</h1>
            <h3 className="subtitle text-base">You have three congresspeople in D.C. Most send to all of them.</h3>
          </div>

          {/* Section 1 - Recipients Panel */}
          <Card className="card-warm mb-6">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Single Voice Label */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-primary">Single Voice</Label>
                  <div className={`cursor-pointer rounded-lg border p-4 transition-all relative ${selection === 'rep-only' ? 'border-2 border-primary bg-primary/[0.02]' : 'border-primary/[0.01] bg-input hover:border-primary/20'}`} onClick={() => handleSelectionChange('rep-only')}>
                    {/* Checkbox in top-right corner */}
                    <div className="absolute top-4 right-4">
                      <Checkbox 
                        checked={selection === 'rep-only'} 
                        onCheckedChange={(checked) => checked && handleSelectionChange('rep-only')}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-3 pr-8">
                      Send to Rep. {rep?.name.split(' ').pop() || 'Representative'} only
                    </h3>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {rep?.photo ? (
                          <img 
                            src={rep.photo} 
                            alt={`Photo of Rep. ${rep.name}`} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary text-sm font-medium">
                            {rep?.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <p className="text-sm text-foreground mb-2">
                      ✓ Rep. {rep?.name}
                    </p>
                    
                    <p className="text-primary font-semibold mb-2">$5 total</p>
                    
                    <p className="text-sm text-muted-foreground">
                      Quieter reach — one office hears you today.
                    </p>
                  </div>
                </div>

                {/* Maximum Impact Label */}
                <div className="space-y-3">
                  <Label className="text-sm font-medium text-primary">Maximum Impact</Label>
                  <div className={`cursor-pointer rounded-lg border p-4 transition-all relative ${selection === 'all-three' ? 'border-2 border-primary bg-primary/[0.02]' : 'border-primary/[0.01] bg-input hover:border-primary/20'}`} onClick={() => handleSelectionChange('all-three')}>
                    {/* Badge in top-left corner */}
                    <div className="absolute top-4 left-4">
                      <Badge className="bg-black text-yellow-400 font-medium">Save $3 - Recommended</Badge>
                    </div>
                    
                    {/* Checkbox in top-right corner */}
                    <div className="absolute top-4 right-4">
                      <Checkbox 
                        checked={selection === 'all-three'} 
                        onCheckedChange={(checked) => checked && handleSelectionChange('all-three')}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-3 pr-8 pt-6">
                      Send to Rep. {rep?.name.split(' ').pop() || 'Representative'}, 
                      {senators[0] && ` Sen. ${senators[0].name.split(' ').pop()}`}
                      {senators[1] && `, and Sen. ${senators[1].name.split(' ').pop()}`}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {rep?.photo ? (
                          <img 
                            src={rep.photo} 
                            alt={`Photo of Rep. ${rep.name}`} 
                            className="w-full h-full object-cover" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-primary text-sm font-medium">
                            {rep?.name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                      </div>
                      {senators[0] && <>
                          <span className="text-muted-foreground">·</span>
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {senators[0].photo ? (
                              <img 
                                src={senators[0].photo} 
                                alt={`Photo of Sen. ${senators[0].name}`} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-primary text-sm font-medium">
                                {senators[0].name.split(' ').map(n => n[0]).join('')}
                              </div>
                            )}
                          </div>
                        </>}
                      {senators[1] && <>
                          <span className="text-muted-foreground">·</span>
                          <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {senators[1].photo ? (
                              <img 
                                src={senators[1].photo} 
                                alt={`Photo of Sen. ${senators[1].name}`} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-primary text-sm font-medium">
                                {senators[1].name.split(' ').map(n => n[0]).join('')}
                              </div>
                            )}
                          </div>
                        </>}
                    </div>
                    
                    <p className="text-primary font-semibold mb-2">$12 total · Save $3</p>
                    
                    <p className="text-sm text-muted-foreground">
                      Your message lands on every federal office that represents you.
                    </p>
                  </div>
                </div>

                {/* Mix & Match Link */}
                <div className="mt-3">
                  <button onClick={() => setShowMixMatch(true)} className="text-sm text-muted-foreground hover:text-primary transition-colors">
                    Mix & match recipients
                  </button>
                  <p className="text-xs text-muted-foreground mt-1">
                    $5 each · Choose any combination (Save $3 when you pick all three)
                  </p>
                </div>

                {/* Validation Error */}
                {validationError && <p className="text-sm text-destructive">{validationError}</p>}
              </div>
            </CardContent>
          </Card>

          {/* Section 3 - Order Summary */}
          <Collapsible open={isOrderSummaryOpen} onOpenChange={setIsOrderSummaryOpen}>
            <Card className="bg-white border-[#E8DECF] shadow-[0_2px_6px_rgba(0,0,0,0.12)] mb-6">
              <CollapsibleTrigger className="w-full">
                <CardHeader className="p-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-semibold text-primary">
                      {isMobile ? `Order summary — ${getSelectedCount()} recipients · $${getTotalPrice()}` : 'Order summary'}
                    </CardTitle>
                    {isMobile && (isOrderSummaryOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </div>
                </CardHeader>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="p-4 pt-0">
                  <div className="space-y-2">
                    {getSelectedRecipients().representative && <div className="flex justify-between">
                        <span>Rep. {rep?.name.split(' ').pop() || 'Representative'}</span>
                        <span>$5.00</span>
                      </div>}
                    {getSelectedRecipients().senator1 && senators[0] && <div className="flex justify-between">
                        <span>Sen. {senators[0].name.split(' ').pop()}</span>
                        <span>$5.00</span>
                      </div>}
                    {getSelectedRecipients().senator2 && senators[1] && <div className="flex justify-between">
                        <span>Sen. {senators[1].name.split(' ').pop()}</span>
                        <span>$5.00</span>
                      </div>}
                    {getSelectedCount() === 3 && <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Bundle savings</span>
                        <span>−$3.00</span>
                      </div>}
                    <div className="border-t border-[#E8DECF] pt-2 mt-2">
                      <div className="flex justify-between text-lg font-bold text-primary">
                        <span>Total</span>
                        <span>${getTotalPrice()}</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-3">
                      Price includes high-quality postcards, real ballpoint pen, and First-Class postage & mailing.
                    </p>
                  </div>
                </CardContent>
              </CollapsibleContent>
            </Card>
          </Collapsible>

          {/* Section 4 - Email & Payments */}
          <Card className="card-warm">
            <CardContent className="p-6">
              <div className="space-y-6">
                {/* Email Input */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-semibold text-primary">Your Email</Label>
                  <Input id="email" type="email" placeholder="you@example.com" value={email} onChange={e => handleEmailChange(e.target.value)} className="bg-white" />
                  <p className="text-sm text-muted-foreground">
                    We'll send you an order confirmation here after checkout and when your card is mailed.
                  </p>
                  {emailError && <p className="text-sm text-destructive">{emailError}</p>}
                </div>




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

        {/* Sticky CTA for Mobile */}
        {isMobile && <div className="fixed bottom-0 left-0 right-0 bg-background border-t p-4 z-40 space-y-2">
            <Button onClick={handlePayment} disabled={!email || !validateEmail(email) || isProcessing} variant="spotlight" className="w-full h-12 text-base font-medium">
              {isProcessing ? <>
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                  <span>Loading...</span>
                </> : <span>Checkout — ${getTotalPrice()}</span>}
            </Button>
            
            {/* Payment Options and Security */}
            <div className="flex justify-center items-center gap-4 text-muted-foreground">
              <img src="/128px-Apple_Pay_logo.svg.png" alt="Apple Pay" className="h-3" />
              <img src="/128px-Google_Pay_Logo.svg.png" alt="Google Pay" className="h-4" />
              <div className="flex items-center gap-1">
                <Shield className="w-3 h-3" />
                <span className="text-xs">Secure checkout with Stripe</span>
              </div>
            </div>
          </div>}
      </div>

      {/* Mix & Match Bottom Sheet */}
      <BottomSheet open={showMixMatch} onOpenChange={setShowMixMatch}>
        <BottomSheetContent>
          <BottomSheetHeader className="p-6 pb-4">
            <BottomSheetTitle>Mix & match recipients</BottomSheetTitle>
            <p className="text-sm text-muted-foreground">$5 each. Choose any combination.</p>
          </BottomSheetHeader>
          
          <div className="px-6 pb-6 space-y-4">
            {/* Representative Option */}
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center space-x-3">
                <Checkbox checked={customSelection.representative} onCheckedChange={checked => handleCustomSelection('representative', checked as boolean)} />
                <div>
                  <span className="font-medium">Rep. {rep?.name}</span>
                  <span className="text-sm text-muted-foreground ml-2">— $5</span>
                </div>
              </div>
            </div>

            {/* Senator Options */}
            {senators.slice(0, 2).map((senator, index) => <div key={senator.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center space-x-3">
                  <Checkbox checked={index === 0 ? customSelection.senator1 : customSelection.senator2} onCheckedChange={checked => handleCustomSelection(index === 0 ? 'senator1' : 'senator2', checked as boolean)} />
                  <div>
                    <span className="font-medium">Sen. {senator.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">— $5</span>
                  </div>
                </div>
              </div>)}

            {/* Guardrail */}
            <p className="text-xs text-muted-foreground">Pick at least one recipient.</p>

            {/* Totals Bar */}
            <div className="sticky bottom-0 bg-background border-t pt-4 mt-6">
              <div className="flex items-center justify-between mb-4">
                <span className="font-medium">
                  {Object.values(customSelection).filter(Boolean).length} selected
                </span>
                <span className="font-semibold">
                  {Object.values(customSelection).filter(Boolean).length === 3 ? <>$15 <span className="line-through text-muted-foreground">$12</span> total · Save $3</> : `$${Object.values(customSelection).filter(Boolean).length * 5} total`}
                </span>
              </div>
              
              <div className="flex gap-3">
                <Button variant="secondary" onClick={() => setShowMixMatch(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={() => {
                setSelection('custom');
                setShowMixMatch(false);
              }} className="flex-1" disabled={Object.values(customSelection).filter(Boolean).length === 0}>
                  Continue — ${Object.values(customSelection).filter(Boolean).length === 3 ? 12 : Object.values(customSelection).filter(Boolean).length * 5}
                </Button>
              </div>
            </div>
          </div>
        </BottomSheetContent>
      </BottomSheet>
    </>;
}