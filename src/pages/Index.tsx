import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppProvider, useAppContext } from '../context/AppContext';
import { LandingPage } from '../components/LandingPage';
import { CivicPostcardApp } from '../components/CivicPostcardApp';

const AppContent = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { dispatch } = useAppContext();

  // Handle return to home and onboarding redirect
  useEffect(() => {
    const shouldSkip = location.state?.skipOnboarding;
    console.log('🔍 Index useEffect triggered:', { shouldSkip, pathname: location.pathname, search: location.search });
    
    if (shouldSkip) {
      // User returned home from onboarding - clear all data and start fresh
      console.log('🏠 User returned home from onboarding - resetting state');
      dispatch({ type: 'RESET_TO_HOME' });
    } else {
      // First visit - redirect to onboarding
      console.log('🔄 First visit - redirecting to onboarding');
      navigate('/onboarding' + location.search, { replace: true });
    }
  }, [navigate, location.search, location.state?.skipOnboarding, dispatch]);

  return <CivicPostcardApp />;
};

const Index = () => {
  return (
    <div>
      {/* TEST: If you see this red banner, changes are deploying */}
      <div style={{ backgroundColor: 'red', color: 'white', padding: '10px', textAlign: 'center', fontSize: '20px', fontWeight: 'bold' }}>
        🔥 DEPLOYMENT TEST: Changes are working! 🔥
      </div>
      <AppProvider>
        <AppContent />
      </AppProvider>
    </div>
  );
};

export default Index;
