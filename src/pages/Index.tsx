import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from '../context/AppContext';
import { LandingPage } from '../components/LandingPage';
import { CivicPostcardApp } from '../components/CivicPostcardApp';

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect to onboarding on initial load (unless skipOnboarding is set)
  useEffect(() => {
    const shouldSkip = location.state?.skipOnboarding;
    if (!shouldSkip) {
      navigate('/onboarding' + location.search, { replace: true });
    }
  }, [navigate, location.search, location.state?.skipOnboarding]);

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
