import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface PostcardHeroProps {
  className?: string;
}

export function PostcardHero({ className = '' }: PostcardHeroProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);

  const images = [
    { src: '/postcard_back.png', alt: 'Postcard back with handwritten message' },
    { src: '/postcard_front.png', alt: 'Postcard front with Yosemite scenery' }
  ];

  // Preload images for instant loading
  useEffect(() => {
    images.forEach(image => {
      const img = new Image();
      img.src = image.src;
    });
  }, []);

  // Auto-advance logic
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 2; // 2% every 100ms = 5 seconds total
        if (newProgress >= 100) {
          if (currentImageIndex === 0) {
            setCurrentImageIndex(1);
            return 0;
          } else {
            setIsAutoPlaying(false);
            return 100;
          }
        }
        return newProgress;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [currentImageIndex, isAutoPlaying]);

  // Handle tap interactions
  const handleTap = (event: React.MouseEvent) => {
    if (isZoomed) return;

    const rect = event.currentTarget.getBoundingClientRect();
    const tapX = event.clientX - rect.left;
    const centerX = rect.width / 2;

    if (isAutoPlaying) {
      setIsAutoPlaying(false);
      setProgress(100);
      return;
    }

    if (tapX > centerX && currentImageIndex === 0) {
      setCurrentImageIndex(1);
    } else if (tapX <= centerX && currentImageIndex === 1) {
      setCurrentImageIndex(0);
    }
  };

  // Handle double tap for zoom
  const handleDoubleClick = (event: React.MouseEvent) => {
    event.preventDefault();
    setIsZoomed(!isZoomed);
  };

  return (
    <div className={`relative ${className}`}>
      {/* Hero text */}
      <div className="text-center mb-6">
        <h1 className="text-2xl font-bold text-primary mb-2 font-spectral">
          Review Your Card
        </h1>
        <p className="text-accent font-inter font-semibold">
          Written with a real pen. Mailed for you.
        </p>
      </div>

      {/* Postcard Images */}
      <Card className="relative overflow-hidden bg-white shadow-lg">
        <div 
          className={`relative aspect-[1.6/1] cursor-pointer transition-transform duration-300 ${
            isZoomed ? 'scale-150' : 'scale-100'
          }`}
          onClick={handleTap}
          onDoubleClick={handleDoubleClick}
        >
          <img
            src={images[currentImageIndex].src}
            alt={images[currentImageIndex].alt}
            className="w-full h-full object-cover"
          />
        </div>
      </Card>

      {/* Progress Bar */}
      <div className="flex gap-1 mt-4 mb-4">
        {images.map((_, index) => (
          <div
            key={index}
            className="flex-1 h-1 bg-disabled rounded-full overflow-hidden"
          >
            <div
              className="h-full bg-secondary transition-all duration-100 ease-linear"
              style={{
                width: index === currentImageIndex ? `${progress}%` : 
                       index < currentImageIndex ? '100%' : '0%'
              }}
            />
          </div>
        ))}
      </div>

      {/* Instructions for mobile */}
      <div className="text-center mt-4 text-sm text-muted-foreground">
        {isZoomed ? (
          <p>Double tap to zoom out</p>
        ) : (
          <p>Tap to control • Double tap to zoom</p>
        )}
      </div>
    </div>
  );
}