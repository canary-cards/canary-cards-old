import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { useToast } from '@/hooks/use-toast';
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
    <header className={`bg-background border-b border-border ${className || ''}`}>
      <div className="flex items-center justify-between px-4 py-4">
        <button 
          onClick={handleLogoClick}
          className="flex items-center space-x-3 hover:opacity-80 transition-opacity"
          aria-label="Go to home"
        >
          <Logo className="h-8" />
          <div className="flex flex-col">
            <span className="display-title text-primary">
              Canary Cards
            </span>
            <span className="text-sm text-muted-foreground hidden sm:block">
              Real postcards. Real impact.
            </span>
          </div>
        </button>
      </div>
    </header>
  );
}