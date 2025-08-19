import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeft } from 'lucide-react';

export function ReviewCardScreen() {
  const { state, dispatch } = useAppContext();
  
  const rep = state.postcardData.representative;
  const userInfo = state.postcardData.userInfo;
  const finalMessage = state.postcardData.finalMessage;

  // Replace placeholders in the message with actual user data
  const replacePlaceholders = (message: string) => {
    if (!message || !userInfo) return message;
    
    return message
      .replace(/\[Your Name\]/g, userInfo.fullName || '')
      .replace(/\[Your City\]/g, userInfo.city || '')
      .replace(/\[Your State\]/g, userInfo.state || '')
      .replace(/\[Your Full Name\]/g, userInfo.fullName || '');
  };

  const displayMessage = replacePlaceholders(finalMessage);

  const handleContinue = () => {
    dispatch({ type: 'SET_STEP', payload: 6 }); // Go to checkout screen
  };

  const goBack = () => {
    dispatch({ type: 'SET_STEP', payload: 4 }); // Go back to return address screen
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-20 pb-8 max-w-2xl">
        <Card className="card-warm">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Review Your Card
              </h1>
              <h3 className="subtitle text-base">
                We'll send this card to a robot that will use real pen and paper to write it
              </h3>
            </div>

            {/* Postcard Preview */}
            <div className="mb-8">
              <Card className="bg-gradient-to-br from-card to-muted/30 border-2">
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left side - Return address */}
                    <div className="space-y-1 text-xs">
                      <p className="font-medium">{userInfo?.fullName}</p>
                      <p>{userInfo?.streetAddress}</p>
                      <p>{userInfo?.city}, {userInfo?.state} {userInfo?.zipCode}</p>
                    </div>
                    
                    {/* Right side - Representative address */}
                    <div className="space-y-1 text-xs">
                      <p className="font-medium">{rep?.name}</p>
                      <p>{rep?.address || 'U.S. House of Representatives'}</p>
                      {!rep?.address && <p>Washington, DC 20515</p>}
                    </div>
                  </div>
                  
                  <div className="p-4 bg-background/80 rounded-lg">
                    <p className="text-xs text-muted-foreground mb-2">Message (handwritten style):</p>
                    <div className="text-sm leading-relaxed font-caveat">
                      {displayMessage}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Navigation Buttons */}
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
              
              <Button 
                onClick={handleContinue}
                variant="primary"
                className="button-warm flex-1"
              >
                <span className="text-sm sm:text-base">Continue</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}