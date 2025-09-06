import React from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className, width, height }: LogoProps) {
  return (
    <svg 
      viewBox="0 0 400 400" 
      className={className}
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect width="400" height="400" fill="white"/>
      <mask id="mask0_2_13" style={{maskType: 'alpha'}} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="400">
        <rect width="400" height="400" fill="#D9D9D9"/>
      </mask>
      <g mask="url(#mask0_2_13)">
        <path d="M71.3889 228.556V171.833C71.3889 167.907 74.5185 164.778 78.4444 164.778H92.9444C96.8704 164.778 100 167.907 100 171.833V221.5C100 263.194 133.417 296.611 175.111 296.611H192.833C196.759 296.611 199.889 299.741 199.889 303.667V318.167C199.889 322.093 196.759 325.222 192.833 325.222H175.111C117.639 325.222 71.3889 279.694 71.3889 228.556Z" fill="#2F4156"/>
        <path d="M300 228.556C300 167.194 250.417 117.611 189.056 117.611H78.4444C74.5185 117.611 71.3889 114.481 71.3889 110.556V96.0556C71.3889 92.1296 74.5185 89 78.4444 89H189.056C266.194 89 328.611 151.417 328.611 228.556V303.667C328.611 307.593 325.481 310.722 321.556 310.722H307.056C303.13 310.722 300 307.593 300 303.667V228.556Z" fill="#2F4156"/>
        <path d="M189.056 246.278C205.833 246.278 219.444 232.667 219.444 215.889C219.444 199.111 205.833 185.5 189.056 185.5C172.278 185.5 158.667 199.111 158.667 215.889C158.667 232.667 172.278 246.278 189.056 246.278Z" fill="#FFD44D"/>
        <line x1="246.278" y1="153.722" x2="310.722" y2="89.2778" stroke="#FFD44D" strokeWidth="28.6111" strokeLinecap="round"/>
        <line x1="325.222" y1="103.778" x2="296.611" y2="132.389" stroke="#FFD44D" strokeWidth="14.3056" strokeLinecap="round"/>
      </g>
    </svg>
  );
}