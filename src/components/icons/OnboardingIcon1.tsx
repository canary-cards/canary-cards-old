import React from 'react';

interface OnboardingIcon1Props {
  className?: string;
  width?: number;
  height?: number;
}

export function OnboardingIcon1({ className, width, height }: OnboardingIcon1Props) {
  return (
    <svg 
      viewBox="0 0 240 240" 
      className={className}
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Capitol building with columns */}
      <rect x="60" y="120" width="120" height="80" fill="#2F4156" rx="4"/>
      <rect x="70" y="130" width="16" height="60" fill="#E8DECF"/>
      <rect x="92" y="130" width="16" height="60" fill="#E8DECF"/>
      <rect x="114" y="130" width="16" height="60" fill="#E8DECF"/>
      <rect x="136" y="130" width="16" height="60" fill="#E8DECF"/>
      <rect x="158" y="130" width="16" height="60" fill="#E8DECF"/>
      
      {/* Dome */}
      <circle cx="120" cy="100" r="30" fill="#FFD44D"/>
      <rect x="115" y="70" width="10" height="20" fill="#2F4156"/>
      
      {/* Steps */}
      <rect x="50" y="200" width="140" height="8" fill="#9CA3AF"/>
      <rect x="55" y="208" width="130" height="8" fill="#6B7280"/>
      
      {/* Postcard floating above */}
      <rect x="80" y="40" width="80" height="50" fill="white" stroke="#FFD44D" strokeWidth="3" rx="4"/>
      <line x1="90" y1="50" x2="150" y2="50" stroke="#2F4156" strokeWidth="2"/>
      <line x1="90" y1="60" x2="140" y2="60" stroke="#2F4156" strokeWidth="2"/>
      <line x1="90" y1="70" x2="145" y2="70" stroke="#2F4156" strokeWidth="2"/>
      
      {/* Arrow pointing down */}
      <path d="M120 95 L115 85 L125 85 Z" fill="#B45309"/>
    </svg>
  );
}