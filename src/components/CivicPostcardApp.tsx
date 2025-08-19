import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { HamburgerMenu } from './HamburgerMenu';
import { ProgressIndicator } from './ProgressIndicator';
import { LandingScreen } from './screens/LandingScreen';
import { ReturnAddressScreen } from './screens/ReturnAddressScreen';
import { CraftMessageScreen } from './screens/CraftMessageScreen';
import { ReviewEditScreen } from './screens/ReviewEditScreen';
import { ReviewCardScreen } from './screens/ReviewCardScreen';
import { CheckoutScreen } from './screens/CheckoutScreen';
import { SuccessScreen } from './screens/SuccessScreen';
import { DraftingScreen } from './screens/DraftingScreen';
import { Logo } from './Logo';

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
        return <ReviewCardScreen />;
      case 6:
        return <CheckoutScreen />;
      case 7:
        return <SuccessScreen />;
      case 8:
        return <DraftingScreen />;
      default:
        return <LandingScreen />;
    }
  };

  return (
    <div className="civic-postcard-app">
      {/* Header with Canary Cards branding and hamburger menu - show on all pages */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-4">
        {/* Logo - show on all pages except step 1 */}
        {state.currentStep > 1 && (
          <Logo />
        )}
        
        {/* Spacer to push hamburger menu to the right when no branding */}
        {state.currentStep === 1 && <div className="flex-1" />}
        
        {/* Hamburger menu - show on all pages */}
        <div className="flex-shrink-0">
          <HamburgerMenu />
        </div>
      </div>
      
      {/* Progress bar - full width below header for steps 2-7 (exclude drafting step 8) */}
      {state.currentStep > 1 && state.currentStep <= 7 && (
        <div className="absolute top-20 left-0 right-0 z-10 px-4">
          <ProgressIndicator currentStep={state.currentStep} totalSteps={7} />
        </div>
      )}
      
      {/* Content with proper spacing */}
      <div className={state.currentStep > 1 && state.currentStep !== 8 ? "pt-12" : ""}>
        {renderCurrentScreen()}
      </div>
    </div>
  );
}