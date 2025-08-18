import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from '../context/AppContext';
import { LandingPage } from '../components/LandingPage';
import { CivicPostcardApp } from '../components/CivicPostcardApp';

const AppContent = () => {
  const { state } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to onboarding on initial load (unless skipOnboarding is set)
  useEffect(() => {
    const shouldSkip = location.state?.skipOnboarding;
    if (!shouldSkip && state.currentStep === 0) {
      navigate('/onboarding' + location.search, { replace: true });
    }
  }, [navigate, location.search, location.state?.skipOnboarding, state.currentStep]);

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
