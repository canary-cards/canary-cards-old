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
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-foreground">InkImpact</h1>
        </div>
        
        {/* Hamburger menu */}
        <div className="flex-shrink-0">
          <HamburgerMenu />
        </div>
      </div>

      {/* Progress bar - full width below header for steps 2-6 */}
      {state.currentStep > 1 && state.currentStep <= 6 && (
        <div className="absolute top-16 left-0 right-0 z-10 px-4">
          <ProgressIndicator currentStep={state.currentStep} totalSteps={6} />
        </div>
      )}

      {/* Main content with appropriate top padding */}
      <div className={state.currentStep > 1 ? "pt-24" : "pt-16"}>
        {renderCurrentScreen()}
      </div>
    </div>
  );
}