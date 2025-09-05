import React, { useState, useEffect } from 'react';
import { EmbeddedCheckout } from './EmbeddedCheckout';

interface GlobalCheckoutManagerProps {
  children: React.ReactNode;
}

interface CheckoutState {
  isVisible: boolean;
  clientSecret: string | null;
  sendOption: 'single' | 'double' | 'triple';
  amount: number;
  onBack: () => void;
}

// Global checkout state
let globalCheckoutState: CheckoutState = {
  isVisible: false,
  clientSecret: null,
  sendOption: 'single',
  amount: 0,
  onBack: () => {}
};

let globalCheckoutSetters: Array<React.Dispatch<React.SetStateAction<CheckoutState>>> = [];

export const showGlobalCheckout = (config: Omit<CheckoutState, 'isVisible'>) => {
  globalCheckoutState = {
    ...config,
    isVisible: true
  };
  
  // Notify all managers
  globalCheckoutSetters.forEach(setter => {
    setter({ ...globalCheckoutState });
  });
};

export const hideGlobalCheckout = () => {
  globalCheckoutState = {
    ...globalCheckoutState,
    isVisible: false,
    clientSecret: null
  };
  
  // Notify all managers
  globalCheckoutSetters.forEach(setter => {
    setter({ ...globalCheckoutState });
  });
};

export const GlobalCheckoutManager: React.FC<GlobalCheckoutManagerProps> = ({ children }) => {
  const [checkoutState, setCheckoutState] = useState<CheckoutState>(globalCheckoutState);

  useEffect(() => {
    // Register this setter
    globalCheckoutSetters.push(setCheckoutState);

    // Cleanup on unmount
    return () => {
      const index = globalCheckoutSetters.indexOf(setCheckoutState);
      if (index > -1) {
        globalCheckoutSetters.splice(index, 1);
      }
    };
  }, []);

  const handleBack = () => {
    checkoutState.onBack();
    hideGlobalCheckout();
  };

  if (checkoutState.isVisible && checkoutState.clientSecret) {
    return (
      <div className="min-h-screen bg-background overflow-y-auto" style={{ scrollBehavior: 'auto' }}>
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <EmbeddedCheckout 
            clientSecret={checkoutState.clientSecret}
            onBack={handleBack}
            sendOption={checkoutState.sendOption}
            amount={checkoutState.amount}
          />
        </div>
      </div>
    );
  }

  return <>{children}</>;
};