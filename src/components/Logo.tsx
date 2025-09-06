import React from 'react';
import { DynamicSvg } from './DynamicSvg';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <DynamicSvg 
      assetName="New Logo v4.svg"
      fallbackSrc="/lovable-uploads/f1289231-63f6-4ee1-9659-4ebb48a190c4.png"
      alt="Canary Cards" 
      className={className}
    />
  );
}