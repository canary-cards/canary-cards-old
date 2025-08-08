import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { HamburgerMenu } from './HamburgerMenu';
import { LandingScreen } from './screens/LandingScreen';
import { ReturnAddressScreen } from './screens/ReturnAddressScreen';
import { CraftMessageScreen } from './screens/CraftMessageScreen';
import { ReviewEditScreen } from './screens/ReviewEditScreen';
import { PreviewSendScreen } from './screens/PreviewSendScreen';
import { SuccessScreen } from './screens/SuccessScreen';

export function CivicPostcardApp() {
  const { state } = useAppContext();

  // Scroll to top when step changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [state.currentStep]);

  const renderCurrentScreen = () => {
    switch (state.currentStep) {
      case 1:
        return <LandingScreen />;
      case 2:
        return <CraftMessageScreen />;
      case 3:
        return <ReviewEditScreen />;
      case 4:
        return <ReturnAddressScreen />;
      case 5:
        return <PreviewSendScreen />;
      case 6:
        return <SuccessScreen />;
      default:
        return <LandingScreen />;
    }
  };

  return (
    <div className="civic-postcard-app">
      <div className="flex items-center justify-between p-4">
        <div className="flex-1 max-w-md">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Step {state.currentStep} of 6</span>
            <span>{Math.round((state.currentStep / 6) * 100)}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-10">
            <div 
              className="bg-primary h-10 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${(state.currentStep / 6) * 100}%` }}
            />
          </div>
        </div>
        <div className="ml-4">
          <HamburgerMenu />
        </div>
      </div>
      {renderCurrentScreen()}
    </div>
  );
}