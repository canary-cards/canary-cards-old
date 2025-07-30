import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="w-full max-w-md mx-auto mb-6 sm:mb-8 px-2 sm:px-0">
      <div className="flex items-center justify-between text-sm sm:text-base text-foreground font-medium mb-3 sm:mb-2">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-3 sm:h-2 shadow-sm">
        <div 
          className="bg-primary h-3 sm:h-2 rounded-full transition-all duration-300 ease-out shadow-sm"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
}