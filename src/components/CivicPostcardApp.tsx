import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { HamburgerMenu } from './HamburgerMenu';
import { ProgressIndicator } from './ProgressIndicator';
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
      {/* Header with branding and hamburger menu */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between">
        {/* Branding */}
        <div className="font-bold text-lg">
          Civic Postcard
        </div>
        
        {/* Hamburger menu */}
        <div className="flex-shrink-0">
          <HamburgerMenu />
        </div>
      </div>

      {/* Progress bar - full width below header */}
      {state.currentStep > 1 && state.currentStep <= 6 && (
        <div className="absolute top-16 left-0 right-0 z-10 px-4">
          <ProgressIndicator currentStep={state.currentStep} totalSteps={6} />
        </div>
      )}
      
      {renderCurrentScreen()}
    </div>
  );
}