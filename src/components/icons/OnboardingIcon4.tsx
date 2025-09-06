import React from 'react';

interface OnboardingIcon4Props {
  className?: string;
  width?: number;
  height?: number;
}

export function OnboardingIcon4({ className, width, height }: OnboardingIcon4Props) {
  return (
    <svg 
      viewBox="0 0 240 240" 
      className={className}
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Mailbox */}
      <rect x="140" y="120" width="80" height="50" fill="#2F4156" rx="25"/>
      <rect x="135" y="170" width="10" height="40" fill="#6B7280"/>
      
      {/* Mailbox flag */}
      <rect x="220" y="130" width="15" height="10" fill="#DC2626" rx="2"/>
      
      {/* Mailbox door */}
      <rect x="150" y="130" width="50" height="30" fill="#1F2937" rx="15"/>
      <circle cx="190" cy="145" r="3" fill="#FFD44D"/>
      
      {/* Postcard being delivered */}
      <rect x="60" y="80" width="80" height="50" fill="white" stroke="#FFD44D" strokeWidth="3" rx="4"/>
      
      {/* Address lines on postcard */}
      <line x1="70" y1="90" x2="120" y2="90" stroke="#2F4156" strokeWidth="2"/>
      <line x1="70" y1="100" x2="110" y2="100" stroke="#2F4156" strokeWidth="2"/>
      <line x1="70" y1="110" x2="115" y2="110" stroke="#2F4156" strokeWidth="2"/>
      
      {/* Motion arrow */}
      <path d="M145 105 L155 105 M150 100 L155 105 L150 110" stroke="#FFD44D" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      
      {/* Delivery truck in background */}
      <rect x="20" y="140" width="50" height="25" fill="#1E40AF" rx="4"/>
      <circle cx="35" cy="175" r="10" fill="#374151"/>
      <circle cx="55" cy="175" r="10" fill="#374151"/>
      <rect x="25" y="145" width="8" height="8" fill="#E8DECF"/>
      
      {/* Speed lines behind truck */}
      <line x1="10" y1="150" x2="15" y2="150" stroke="#9CA3AF" strokeWidth="2"/>
      <line x1="8" y1="160" x2="13" y2="160" stroke="#9CA3AF" strokeWidth="2"/>
      <line x1="12" y1="170" x2="17" y2="170" stroke="#9CA3AF" strokeWidth="2"/>
    </svg>
  );
}