import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeft, Info, Apple } from 'lucide-react';
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

              <div className="space-y-6">
                {/* Lawmaker Cards */}
                <div className="space-y-4">
                  {/* Representative (always selected, disabled) */}
                  {rep && (
                    <Card className="border-2 border-primary bg-card">
                      <CardContent className="p-4">
                        <div className="flex items-start space-x-4">
                          <Checkbox 
                            checked={true} 
                            disabled={true}
                            className="mt-1"
                          />
                          <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                            {rep.photo ? (
                              <img src={rep.photo} alt={rep.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-primary text-sm font-medium">
                                {rep.name.split(' ').map(n => n[0]).join('')}
                              </div>
                            )}
                          </div>
                          <div className="flex-1">
                            <h4 className="font-medium text-foreground mb-1">
                              Send to your Representative — $5.00
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              Your local Representative is directly accountable to your district.
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Senators */}
                  {loadingSenators ? (
                    <>
                      <Card className="bg-gradient-to-br from-muted/20 to-muted/40">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className="w-4 h-4 bg-muted rounded mt-1 animate-pulse" />
                            <div className="w-16 h-16 bg-muted rounded-lg animate-pulse" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-muted rounded animate-pulse" />
                              <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      <Card className="bg-gradient-to-br from-muted/20 to-muted/40">
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <div className="w-4 h-4 bg-muted rounded mt-1 animate-pulse" />
                            <div className="w-16 h-16 bg-muted rounded-lg animate-pulse" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 bg-muted rounded animate-pulse" />
                              <div className="h-3 bg-muted rounded w-3/4 animate-pulse" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </>
                  ) : (
                    senators.slice(0, 2).map((senator, index) => (
                      <Card 
                        key={senator.id} 
                        className={`transition-all ${selectedSenators[index] ? 'border-2 border-primary bg-card' : 'border border-border bg-card'}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start space-x-4">
                            <Checkbox 
                              checked={selectedSenators[index]} 
                              onCheckedChange={(checked) => handleSenatorToggle(index, checked as boolean)}
                              className="mt-1"
                            />
                            <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                              {senator.photo ? (
                                <img src={senator.photo} alt={senator.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-primary text-sm font-medium">
                                  {senator.name.split(' ').map(n => n[0]).join('')}
                                </div>
                              )}
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium text-foreground mb-1">
                                {index === 0 ? 'Also send to' : 'And send to'} 
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <span className="inline-flex items-center ml-1">
                                      Senator
                                      <Info className="w-3 h-3 ml-1 text-muted-foreground" />
                                    </span>
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-xs">
                                    <p>
                                      {index === 0 
                                        ? "Every state has two U.S. Senators who represent the whole state. We've already verified their official addresses—no extra steps."
                                        : "You have two Senators. We'll automatically address and mail each card to the correct office."
                                      }
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                                {' '}{senator.name} — +$3.00
                              </h4>
                              <p className="text-sm text-muted-foreground">
                                {index === 0 
                                  ? `Make your message heard in the Senate. Adding ${senator.name} means both chambers hear from you.`
                                  : `Double your impact. Both Senators ensure your state's full voice is heard in the Senate.`
                                }
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))
                  )}

                  {/* Address reassurance */}
                  {senators.length > 0 && (
                    <p className="text-sm text-muted-foreground">
                      We've got it covered: Your Senators' official mailing addresses are already confirmed—nothing for you to look up.
                    </p>
                  )}
                </div>

                {/* Impact + Social Proof */}
                <div className="text-center">
                  <p className="text-base text-foreground">
                    You're joining others making themselves heard today. Most people send to all 3 lawmakers.
                  </p>
                </div>

                {/* Order Summary */}
                <Card className="bg-muted/20">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-center">
                      <span className="font-semibold text-foreground">Total:</span>
                      <span className="font-bold text-lg text-foreground">
                        ${getTotalPrice().toFixed(2)} 
                        {getSendOption() === 'single' && ' (Representative)'}
                        {getSendOption() === 'double' && ' (Rep + 1 Senator)'}
                        {getSendOption() === 'triple' && ' (Rep + 2 Senators)'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

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