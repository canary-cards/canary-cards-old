import React from 'react';
import { useAppContext } from '../context/AppContext';
import { InviteCodeScreen } from './screens/InviteCodeScreen';
import { LandingScreen } from './screens/LandingScreen';

export function CivicPostcardApp() {
  const { state } = useAppContext();

  const renderCurrentScreen = () => {
    switch (state.currentStep) {
      case 1:
        return <InviteCodeScreen />;
      case 2:
        return <LandingScreen />;
      default:
        return <InviteCodeScreen />;
    }
  };

  return <div className="civic-postcard-app">{renderCurrentScreen()}</div>;
}