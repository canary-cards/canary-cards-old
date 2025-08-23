import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Logo } from './Logo';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const navigate = useNavigate();

  const handleLogoClick = () => {
    navigate('/', { state: { skipOnboarding: true } });
  };

  return (
    <header className={`bg-background border-b border-border ${className || ''}`}>
      <div className="flex items-center justify-between px-4 py-3">
        <button 
          onClick={handleLogoClick}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          aria-label="Go to home"
        >
          <Logo className="h-8" />
          <span className="display-title text-primary hidden sm:block">
            Canary Cards
          </span>
        </button>
      </div>
    </header>
  );
}