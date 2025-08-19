import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { LawmakerSelectCard } from '@/components/ui/lawmaker-select-card';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeft, Apple } from 'lucide-react';
import { lookupRepresentativesAndSenators } from '@/services/geocodio';
import { Representative } from '@/types';
import { useNavigate } from 'react-router-dom';

export function CheckoutScreen() {
  const { state, dispatch } = useAppContext();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState(state.postcardData.email || '');
  const [emailError, setEmailError] = useState('');
  const [senators, setSenators] = useState<Representative[]>([]);
  const [loadingSenators, setLoadingSenators] = useState(false);
  const [selectedSenators, setSelectedSenators] = useState<boolean[]>([true, false]); // Senator 1 checked by default
  
  const rep = state.postcardData.representative;
  const userInfo = state.postcardData.userInfo;

  // Fetch senators when component mounts
  useEffect(() => {
    const fetchSenatorsFromZip = async () => {
      if (userInfo?.zipCode) {
        setLoadingSenators(true);
        try {
          const { senators: stateSenators } = await lookupRepresentativesAndSenators(userInfo.zipCode);
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
    return 5.00 + (senatorCount * 3.00);
  };

  const getSendOption = (): 'single' | 'double' | 'triple' => {
    const senatorCount = getSelectedSenatorsCount();
    if (senatorCount === 0) return 'single';
    if (senatorCount === 1) return 'double'; 
    return 'triple';
  };

  const handleContinueToCheckout = () => {
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    const sendOption = getSendOption();
    const selectedSenatorsList = senators.filter((_, index) => selectedSenators[index]);

    // Update app state
    dispatch({
      type: 'UPDATE_POSTCARD_DATA',
      payload: {
        sendOption,
        email,
        senators: selectedSenatorsList
      }
    });

    // Navigate to checkout
    navigate('/checkout');
  };

  const goBack = () => {
    dispatch({ type: 'SET_STEP', payload: 5 }); // Go back to review card screen
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 pt-20 pb-8 max-w-2xl">
          <Card className="card-warm">
            <CardContent className="p-8">
              {/* Header Section */}
              <div className="text-center mb-8">
                <h1 className="text-2xl font-bold text-foreground mb-2">
                  Your postcard will be read.
                </h1>
                <h3 className="subtitle text-base">
                  Postcards from verified constituents reach your lawmakers' desks—faster than letters, stronger than email.
                </h3>
              </div>

              {/* Instruction Line */}
              <p className="text-base text-foreground mb-6">
                Pick where your message goes. Start with your Representative, then add your Senators.
              </p>

              <div className="space-y-4">
                {/* Lawmaker Cards */}
                <div className="space-y-3">
                  {/* Representative Section */}
                  {rep && (
                    <div className="space-y-4">
                      <div className="px-1">
                        <p className="text-sm font-medium text-foreground leading-tight mb-3">
                          Your representative is directly accountable to your district.
                        </p>
                      </div>
                      <LawmakerSelectCard
                        lawmaker={{
                          ...rep,
                          type: 'Representative'
                        }}
                        isSelected={true}
                        isDisabled={true}
                        price="$5"
                        valueText=""
                        supportText=""
                        showTooltip={false}
                      />
                    </div>
                  )}

                  {/* Senators Section */}
                  <div className="space-y-4">
                    <div className="px-1">
                      <p className="text-sm font-medium text-foreground leading-tight mb-3">
                        Make your message heard in the Senate. Both chambers matter. Senators represent your entire state.
                      </p>
                    </div>
                    <div className="space-y-3">
                      {loadingSenators ? (
                        <>
                          {/* Loading skeleton for senators */}
                          {[0, 1].map((index) => (
                            <Card key={index} className="bg-gradient-to-br from-muted/20 to-muted/40">
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
                            </Card>
                          ))}
                        </>
                      ) : (
                        senators.slice(0, 2).map((senator, index) => (
                          <LawmakerSelectCard
                            key={senator.id}
                            lawmaker={{
                              ...senator,
                              type: 'Senator'
                            }}
                            isSelected={selectedSenators[index]}
                            price="$3"
                            valueText=""
                            supportText=""
                            onSelectionChange={(checked) => handleSenatorToggle(index, checked)}
                            showTooltip={false}
                          />
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* Address reassurance */}
                {senators.length > 0 && !loadingSenators && (
                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      ✓ All official mailing addresses are verified and ready to go
                    </p>
                  </div>
                )}
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
                  <p className="text-sm text-muted-foreground">
                    Most people send to all 3 lawmakers for maximum impact
                  </p>
                </div>

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

                {/* Primary CTA */}
                <div className="space-y-4">
                  <Button 
                    onClick={handleContinueToCheckout} 
                    disabled={!email || !validateEmail(email)} 
                    variant="spotlight" 
                    className="w-full h-12 sm:h-14 button-warm text-sm sm:text-base md:text-lg"
                  >
                    Continue to Checkout
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
    </TooltipProvider>
  );
}