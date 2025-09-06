import React from 'react';
import { DynamicSvg } from './DynamicSvg';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <DynamicSvg 
      assetName="New Logo v4.svg"
      fallbackSrc="/postallogov1.svg"
      alt="Canary Cards" 
      className={className}
      height={52} // Matches --logo-size (3.25rem = 52px)
    />
  );
}