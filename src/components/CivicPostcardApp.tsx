import React from 'react';
import { useAppContext } from '../context/AppContext';
import { InviteCodeScreen } from './screens/InviteCodeScreen';
import { LandingScreen } from './screens/LandingScreen';
import { ReturnAddressScreen } from './screens/ReturnAddressScreen';
import { CraftMessageScreen } from './screens/CraftMessageScreen';
import { ReviewEditScreen } from './screens/ReviewEditScreen';
import { PreviewSendScreen } from './screens/PreviewSendScreen';
import { SuccessScreen } from './screens/SuccessScreen';

export function CivicPostcardApp() {
  const { state } = useAppContext();

  const renderCurrentScreen = () => {
    switch (state.currentStep) {
      case 1:
        return <InviteCodeScreen />;
      case 2:
        return <LandingScreen />;
      case 3:
        return <ReturnAddressScreen />;
      case 4:
        return <CraftMessageScreen />;
      case 5:
        return <ReviewEditScreen />;
      case 6:
        return <PreviewSendScreen />;
      case 7:
        return <SuccessScreen />;
      default:
        return <InviteCodeScreen />;
    }
  };

  return <div className="civic-postcard-app">{renderCurrentScreen()}</div>;
}