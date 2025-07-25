import React from 'react';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

export function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="w-full max-w-md mx-auto mb-8">
      <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
        <span>Step {currentStep} of {totalSteps}</span>
        <span>{Math.round((currentStep / totalSteps) * 100)}%</span>
      </div>
      <div className="w-full bg-muted rounded-full h-2">
        <div 
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
    </div>
  );
}