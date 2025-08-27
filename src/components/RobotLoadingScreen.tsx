import { useState, useEffect } from 'react';
import { Bot, Zap, CheckCircle, AlertCircle } from 'lucide-react';

interface RobotLoadingScreenProps {
  status: 'loading' | 'error';
  message?: string;
  onRetry?: () => void;
}

export const RobotLoadingScreen = ({ status, message, onRetry }: RobotLoadingScreenProps) => {
  const [currentMessage, setCurrentMessage] = useState(0);
  
  const loadingMessages = [
    "Your payment went through. Our robots are picking up their pens. This only takes a few seconds.",
    "Preparing your civic message...", 
    "Connecting to representative networks...",
    "Dispatching your voice to democracy..."
  ];

  useEffect(() => {
    if (status === 'loading') {
      const interval = setInterval(() => {
        setCurrentMessage(prev => (prev + 1) % loadingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [status]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 flex items-center justify-center p-4">
      <div className="text-center space-y-8 max-w-md">
        {/* Icon 2 Animation */}
        <div className="relative flex justify-center">
          {status === 'loading' && (
            <>
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping scale-150"></div>
              <div className="relative w-32 h-32 bg-primary/10 rounded-full flex items-center justify-center border-4 border-primary/20 animate-pulse">
                <img 
                  src="/smallonboarding2.svg" 
                  alt="Processing" 
                  className="w-20 h-20 animate-bounce" 
                />
              </div>
              {/* Zap animations around the icon */}
              <Zap className="absolute top-2 right-2 w-6 h-6 text-accent animate-pulse" style={{ animationDelay: '0.5s' }} />
              <Zap className="absolute bottom-2 left-2 w-4 h-4 text-secondary animate-pulse" style={{ animationDelay: '1s' }} />
            </>
          )}
          
          
          {status === 'error' && (
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center border-4 border-red-200 shake">
              <AlertCircle className="w-12 h-12 text-red-600" />
            </div>
          )}
        </div>

        {/* Status Messages */}
        <div className="space-y-4">
          <h1 className="display-title text-primary">
            {status === 'loading' && "We're writing your postcard..."}
            {status === 'error' && "Oops! Something Went Wrong"}
          </h1>
          
          <div className="space-y-2">
            {status === 'loading' && (
              <p className="body-text text-muted-foreground animate-fade-in" key={currentMessage}>
                {loadingMessages[currentMessage]}
              </p>
            )}
            
            
            {status === 'error' && (
              <div className="space-y-4">
                <p className="text-lg text-muted-foreground">
                  {message || "There was an issue processing your postcard order. Don't worry - your payment was successful."}
                </p>
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors button-warm"
                  >
                    Try Again
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Fun Fact Card */}
        {status === 'loading' && (
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-4 card-warm">
            <div className="space-y-2">
              <p className="eyebrow text-accent-foreground">Did you know?</p>
              <p className="text-sm text-muted-foreground">
                Our robots use real pens so your card looks just like one you'd write yourself.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};