import React from 'react';
import { Logo as LogoIcon } from './icons';

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <LogoIcon className={className} />
  );
}