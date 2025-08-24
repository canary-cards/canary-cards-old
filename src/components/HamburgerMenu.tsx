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
        className="w-[320px] md:w-[360px] bg-white text-primary border-l-0"
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
          <h2 id="menu-title" className="px-4 pt-4 text-base font-semibold">
            Menu
          </h2>
          
          <nav className="mt-2">
            <Link
              to="/about"
              onClick={() => setOpen(false)}
              className="block px-4 py-3 text-base hover:bg-[#FEF4E9] focus:outline-none focus:ring-2 focus:ring-[--ring] rounded-[var(--radius)] motion-safe:transition-colors motion-safe:duration-200"
            >
              About Canary
              <p className="text-sm text-muted-foreground">
                Real postcards. Real impact.
              </p>
            </Link>
          </nav>
        </div>
      </SheetContent>
    </Sheet>
  );
}