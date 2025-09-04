import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Repeat } from 'lucide-react';

interface PostcardHeroProps {
  className?: string;
}

export function PostcardHero({ className = '' }: PostcardHeroProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [isBouncing, setIsBouncing] = useState(false);
  
  // Use refs to avoid stale closures
  const lastTapTimeRef = useRef(0);
  const singleTapTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const images = [
    { src: '/lovable-uploads/923b18b9-bce0-4521-a280-f38eaec3e09c.png', alt: 'Postcard back with handwritten message' },
    { src: '/postcard_front.png', alt: 'Postcard front with Yosemite scenery' }
  ];

  // Preload images for instant loading
  useEffect(() => {
    images.forEach(image => {
      const img = new Image();
      img.src = image.src;
    });
  }, []);


  // Flip animation handler
  const performFlip = () => {
    if (isFlipping) return;
    
    setIsBouncing(true);
    setIsFlipping(true);
    
    // Change image at exactly 90 degrees (250ms into 500ms animation)
    setTimeout(() => {
      setCurrentImageIndex(prev => prev === 0 ? 1 : 0);
    }, 250);
    
    // Reset flip state after animation completes
    setTimeout(() => {
      setIsFlipping(false);
    }, 500);
    
    // Reset bounce state quickly
    setTimeout(() => {
      setIsBouncing(false);
    }, 150);
  };

  // Handle pointer interactions (mobile and desktop)
  const handlePointerDown = (event: React.PointerEvent) => {
    if (isFlipping) return;

    const currentTime = Date.now();
    const timeDiff = currentTime - lastTapTimeRef.current;

    if (timeDiff < 350) {
      // Double tap detected - zoom and cancel any pending single tap
      event.preventDefault();
      if (singleTapTimeoutRef.current) {
        clearTimeout(singleTapTimeoutRef.current);
        singleTapTimeoutRef.current = null;
      }
      setIsZoomed(prev => !prev);
      lastTapTimeRef.current = 0; // Reset to prevent triple tap
    } else {
      // Potential single tap - set up delayed action
      lastTapTimeRef.current = currentTime;
      
      if (!isZoomed) {
        // Clear any existing timeout
        if (singleTapTimeoutRef.current) {
          clearTimeout(singleTapTimeoutRef.current);
        }
        
        // Set up delayed flip action
        singleTapTimeoutRef.current = setTimeout(() => {
          // Only flip if this tap wasn't followed by another tap (double tap)
          if (Date.now() - lastTapTimeRef.current >= 300) {
            performFlip();
          }
          singleTapTimeoutRef.current = null;
        }, 350);
      }
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Hero Card containing everything */}
      <Card className="p-6">
        {/* Hero text */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-primary mb-2 font-display">
            Here's how your postcard will look.
          </h1>
          <p className="text-secondary font-inter">
            This is an example — your message will be written with a ballpoint pen on a real postcard we mail for you
          </p>
        </div>

        {/* Caption */}
        <div className="text-center mb-3">
          <p className="text-sm text-muted-foreground font-inter">
            {currentImageIndex === 0 ? "Back — Your message" : "Front — Photo side"}
          </p>
        </div>

        {/* Postcard Images */}
        <div className="relative overflow-hidden bg-white shadow-xl rounded-lg mb-4" style={{ perspective: '1000px' }}>
          <div 
            className={`relative aspect-[1.6/1] cursor-pointer transition-all duration-300 transform-gpu ${
              isZoomed ? 'scale-150' : 'scale-100'
            } ${
              isFlipping ? 'animate-[flip_0.5s_ease-in-out]' : ''
            } ${
              isBouncing ? 'animate-[bounce_0.2s_ease-out]' : ''
            }`}
            onPointerDown={handlePointerDown}
            style={{ transformStyle: 'preserve-3d', touchAction: 'manipulation' }}
          >
            <img
              src={images[currentImageIndex].src}
              alt={images[currentImageIndex].alt}
              className="w-full h-full object-cover"
              style={{ backfaceVisibility: 'hidden' }}
              loading="eager"
              fetchPriority="high"
            />
            
            {/* Circular Flip Button - positioned in lower right */}
            <Button 
              variant="primary"
              size="icon"
              onPointerDown={(e) => {
                e.stopPropagation();
                performFlip();
              }}
              className={`absolute bottom-4 right-4 !w-10 !h-10 !min-h-0 rounded-full shadow-lg hover:shadow-xl transition-all p-0 min-w-0 ${
                isFlipping ? 'scale-110 rotate-180' : 'hover:scale-105'
              }`}
              aria-label="Flip postcard"
              disabled={isFlipping}
            >
              <Repeat className="h-4 w-4 text-accent" />
            </Button>
          </div>
        </div>

        {/* Instructions for mobile */}
        <div className="text-center text-sm text-muted-foreground">
          <p>Double tap to zoom in.</p>
        </div>
      </Card>
    </div>
  );
}