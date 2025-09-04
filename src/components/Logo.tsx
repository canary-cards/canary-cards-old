import React from 'react';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <img 
      src="/New Brand Logo.svg" 
      alt="Canary Cards" 
      className={className}
      style={{ height: 'var(--logo-size)', width: 'auto' }}
    />
  );
}