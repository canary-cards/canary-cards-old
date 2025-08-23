import React, { useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Header } from './Header';
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
import { EmailTestButton } from './EmailTestButton';

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
        return <DraftingScreen />;
      case 8:
        return <SuccessScreen />;
      default:
        return <LandingScreen />;
    }
  };

  return (
    <div className="civic-postcard-app">
      {/* Header - show on all pages */}
      <Header />
      
      {/* Progress bar - for steps 2-6 and 8 (exclude drafting step 7) */}
      {state.currentStep > 1 && state.currentStep <= 6 || state.currentStep === 8 && (
        <div className="px-4 py-2">
          <ProgressIndicator currentStep={state.currentStep} totalSteps={7} />
        </div>
      )}
      
      {/* Content */}
      <div>
        {renderCurrentScreen()}
      </div>
    </div>
  );
}