
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useToast } from '@/hooks/use-toast';
import { HamburgerMenu } from './HamburgerMenu';
import { Logo } from './Logo';

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { dispatch } = useAppContext();
  const { toast } = useToast();

  const handleLogoClick = () => {
    console.log('🖱️ Logo clicked - current path:', location.pathname);
    
    if (location.pathname === '/') {
      // Already on home page, directly reset state
      console.log('🏠 Already on home - directly resetting state');
      dispatch({ type: 'RESET_TO_HOME' });
      toast({
        description: "Returned to start",
        duration: 2000,
      });
    } else {
      // Navigate to home page
      console.log('🔄 Navigating to home');
      navigate('/', { state: { skipOnboarding: true } });
      toast({
        description: "Returned to start",
        duration: 2000,
      });
    }
  };

  return (
    <header className={`h-14 md:h-16 bg-background border-b border-[#E8DECF] ${className || ''}`}>
      <div className="flex items-center justify-between px-4 h-full">
        <button 
          onClick={handleLogoClick}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          aria-label="Go to home"
        >
          <Logo className="h-8" />
          <div className="hidden md:flex flex-col">
            <span className="font-semibold text-primary" style={{ fontFamily: 'Spectral', fontWeight: 600 }}>
              Canary Cards
            </span>
            <span className="text-sm text-muted-foreground hidden sm:block">
              Real postcards. Real impact.
            </span>
          </div>
        </button>
        
        {/* Only show hamburger menu if NOT on onboarding page */}
        {!location.pathname.startsWith('/onboarding') && (
          <HamburgerMenu />
        )}
      </div>
    </header>
  );
}
