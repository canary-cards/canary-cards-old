import React from 'react';

interface OnboardingIcon2Props {
  className?: string;
  width?: number;
  height?: number;
}

export function OnboardingIcon2({ className, width, height }: OnboardingIcon2Props) {
  return (
    <svg 
      viewBox="0 0 240 240" 
      className={className}
      width={width}
      height={height}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Canary bird body */}
      <ellipse cx="120" cy="120" rx="50" ry="35" fill="#FFD44D"/>
      
      {/* Wing */}
      <ellipse cx="105" cy="115" rx="20" ry="25" fill="#F59E0B"/>
      
      {/* Head */}
      <circle cx="140" cy="95" r="25" fill="#FFD44D"/>
      
      {/* Beak */}
      <path d="M160 95 L175 90 L170 100 Z" fill="#B45309"/>
      
      {/* Eye */}
      <circle cx="145" cy="90" r="4" fill="#2F4156"/>
      
      {/* Legs */}
      <line x1="110" y1="155" x2="105" y2="170" stroke="#B45309" strokeWidth="3"/>
      <line x1="125" y1="155" x2="120" y2="170" stroke="#B45309" strokeWidth="3"/>
      
      {/* Research elements around the bird */}
      <circle cx="60" cy="60" r="8" fill="#2F4156"/>
      <circle cx="180" cy="70" r="6" fill="#2F4156"/>
      <circle cx="70" cy="180" r="7" fill="#2F4156"/>
      <circle cx="170" cy="160" r="5" fill="#2F4156"/>
      
      {/* Connecting lines showing research */}
      <line x1="68" y1="68" x2="95" y2="100" stroke="#E8DECF" strokeWidth="2" strokeDasharray="5,5"/>
      <line x1="172" y1="78" x2="150" y2="105" stroke="#E8DECF" strokeWidth="2" strokeDasharray="5,5"/>
      <line x1="78" y1="172" x2="100" y2="140" stroke="#E8DECF" strokeWidth="2" strokeDasharray="5,5"/>
      <line x1="162" y1="152" x2="140" y2="125" stroke="#E8DECF" strokeWidth="2" strokeDasharray="5,5"/>
      
      {/* Small sparkles around the bird */}
      <path d="M200 50 L202 54 L206 52 L202 56 L200 60 L198 56 L194 52 L198 54 Z" fill="#FFD44D"/>
      <path d="M50 200 L51 202 L53 201 L51 203 L50 205 L49 203 L47 201 L49 202 Z" fill="#FFD44D"/>
    </svg>
  );
}