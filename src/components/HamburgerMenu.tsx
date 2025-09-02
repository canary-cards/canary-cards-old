import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Handle ESC key to close menu
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && open) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [open]);

  const isActive = (href: string) => location.pathname === href;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative z-50 focus:outline-none focus:ring-2 focus:ring-[--ring] focus:ring-offset-2"
          aria-controls="site-menu"
          aria-expanded={open}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5 text-primary" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="right" 
        className="bg-white text-primary border-l-0 max-h-screen overflow-y-auto w-[92vw] max-w-[360px] sm:w-[88vw] sm:max-w-[380px] lg:w-[400px] lg:max-w-none"
        style={{
          '--sheet-overlay-bg': 'rgba(47, 65, 86, 0.35)',
          animationDuration: 'var(--motion-duration-200, 200ms)',
        } as React.CSSProperties}
      >
        <div 
          className="flex flex-col h-full"
          role="dialog"
          id="site-menu"
          aria-labelledby="menu-title"
        >
          <div className="px-4 md:px-5 lg:px-6 pt-4 pb-2 border-b border-[#E8DECF]">
            <h2 id="menu-title" className="subtitle text-secondary">
              Menu
            </h2>
          </div>
          
          <nav className="flex-1 px-4 md:px-5 lg:px-6 py-2">
            <div className="space-y-2">
              <Link
                to="/about"
                onClick={() => setOpen(false)}
                className="block py-3 body-text hover:bg-[#FEF4E9] focus:outline-none focus:ring-2 focus:ring-primary rounded-[var(--radius)] motion-safe:transition-colors motion-safe:duration-200 min-h-[44px] flex items-center"
              >
                <div>
                  <div className="text-primary">About Canary</div>
                  <div className="field-label text-muted-foreground mt-1">
                    Real postcards. Real impact.
                  </div>
                </div>
              </Link>
            </div>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}