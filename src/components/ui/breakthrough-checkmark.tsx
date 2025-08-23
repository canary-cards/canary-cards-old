import React from 'react';

interface BreakthroughCheckmarkProps {
  size?: number;
  className?: string;
}

export const BreakthroughCheckmark: React.FC<BreakthroughCheckmarkProps> = ({ 
  size = 48, 
  className = "" 
}) => {
  return (
    <div className={`relative ${className}`} style={{ width: size, height: size }}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Blue outer circle with gaps */}
        <defs>
          <mask id="blueMask">
            <rect width="48" height="48" fill="white" />
            {/* Create gaps where checkmark extends through */}
            <path
              d="M20 26L22 28L28 20"
              stroke="black"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </mask>
        </defs>
        
        <circle
          cx="24"
          cy="24"
          r="22"
          stroke="hsl(var(--primary))"
          strokeWidth="2"
          fill="none"
          mask="url(#blueMask)"
        />
        
        {/* Gold inner circle with gaps */}
        <defs>
          <mask id="goldMask">
            <rect width="48" height="48" fill="white" />
            {/* Create gaps where checkmark extends through */}
            <path
              d="M20 26L22 28L28 20"
              stroke="black"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </mask>
        </defs>
        
        <circle
          cx="24"
          cy="24"
          r="16"
          fill="hsl(var(--accent))"
          mask="url(#goldMask)"
        />
        
        {/* Checkmark on top */}
        <path
          d="M20 26L22 28L28 20"
          stroke="hsl(var(--accent))"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      </svg>
    </div>
  );
};