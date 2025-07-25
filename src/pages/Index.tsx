import React from 'react';
import { AppProvider } from '../context/AppContext';
import { CivicPostcardApp } from '../components/CivicPostcardApp';

const Index = () => {
  return (
    <AppProvider>
      <CivicPostcardApp />
    </AppProvider>
  );
};

export default Index;
