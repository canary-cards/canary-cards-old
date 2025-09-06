import React from 'react';

interface OnboardingIcon3Props {
  className?: string;
  width?: number;
  height?: number;
}

export function OnboardingIcon3({ className, width, height }: OnboardingIcon3Props) {
  return (
    <svg 
      viewBox="0 0 240 240" 
      className={className}
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Robot arm base */}
      <rect x="40" y="180" width="40" height="40" fill="#6B7280" rx="8"/>
      
      {/* Robot arm segments */}
      <rect x="80" y="165" width="60" height="15" fill="#9CA3AF" rx="7"/>
      <rect x="140" y="120" width="15" height="60" fill="#9CA3AF" rx="7"/>
      
      {/* Joints */}
      <circle cx="80" cy="172" r="8" fill="#4B5563"/>
      <circle cx="147" cy="120" r="8" fill="#4B5563"/>
      
      {/* Robot hand holding pen */}
      <ellipse cx="147" cy="100" rx="12" ry="8" fill="#6B7280"/>
      
      {/* Pen */}
      <rect x="142" y="85" width="10" height="30" fill="#1E40AF" rx="2"/>
      <rect x="144" y="82" width="6" height="8" fill="#FFD44D" rx="1"/>
      
      {/* Postcard being written on */}
      <rect x="80" y="60" width="100" height="70" fill="white" stroke="#E8DECF" strokeWidth="2" rx="4"/>
      
      {/* Handwritten text lines */}
      <path d="M90 75 Q95 78 100 75 T110 78 T120 75" stroke="#1E40AF" strokeWidth="2" fill="none"/>
      <path d="M90 85 Q98 88 105 85 T118 88 T130 85" stroke="#1E40AF" strokeWidth="2" fill="none"/>
      <path d="M90 95 Q96 98 102 95 T115 98 T125 95" stroke="#1E40AF" strokeWidth="2" fill="none"/>
      <path d="M90 105 Q100 108 110 105 T125 108 T135 105" stroke="#1E40AF" strokeWidth="2" fill="none"/>
      
      {/* Ink droplet */}
      <circle cx="155" cy="75" r="3" fill="#1E40AF"/>
      
      {/* Motion lines */}
      <path d="M135 90 L140 85" stroke="#FFD44D" strokeWidth="2" strokeLinecap="round"/>
      <path d="M130 95 L135 90" stroke="#FFD44D" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}