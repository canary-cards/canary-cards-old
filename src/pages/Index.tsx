import React from 'react';
import { AppProvider, useAppContext } from '../context/AppContext';
import { LandingPage } from '../components/LandingPage';
import { CivicPostcardApp } from '../components/CivicPostcardApp';

const AppContent = () => {
  const { state } = useAppContext();
  
  if (state.currentStep === 0) {
    return <LandingPage />;
  }
  
  return <CivicPostcardApp />;
};

const Index = () => {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
};

export default Index;
