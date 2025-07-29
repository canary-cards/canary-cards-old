import React from 'react';
import { AppProvider } from '../context/AppContext';
import { LandingPage } from '../components/LandingPage';

const Index = () => {
  return (
    <AppProvider>
      <LandingPage />
    </AppProvider>
  );
};

export default Index;
