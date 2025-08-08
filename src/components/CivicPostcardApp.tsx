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
import { Mail } from 'lucide-react';

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
      {/* Header with InkImpact branding and hamburger menu - show on all pages */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-4">
        {/* InkImpact Branding - show on all pages except step 1 */}
        {state.currentStep > 1 && (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">InkImpact</h1>
          </div>
        )}
        
        {/* Spacer to push hamburger menu to the right when no branding */}
        {state.currentStep === 1 && <div className="flex-1" />}
        
        {/* Hamburger menu - show on all pages */}
        <div className="flex-shrink-0">
          <HamburgerMenu />
        </div>
      </div>
      
      {/* Progress bar - full width below header for steps 2-6 */}
      {state.currentStep > 1 && state.currentStep <= 6 && (
        <div className="absolute top-20 left-0 right-0 z-10 px-4">
          <ProgressIndicator currentStep={state.currentStep} totalSteps={6} />
        </div>
      )}
      
      {/* Content with proper spacing */}
      <div className={state.currentStep > 1 ? "pt-16" : ""}>
        {renderCurrentScreen()}
      </div>
    </div>
  );
}