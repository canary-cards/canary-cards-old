import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className = "h-13 w-auto" }: LogoProps) {
  return (
    <img 
      src="/postallogov1.svg" 
      alt="Canary Cards" 
      className={className}
    />
  );
}