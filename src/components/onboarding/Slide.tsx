import React from 'react';

interface SlideProps {
  title: string;
  subtitle: string;
  finePrint?: string;
  iconPlaceholder: string;
  imageSrc?: string;
  imageAlt?: string;
  currentSlide: number;
  allImages: Array<{ src: string; alt: string; }>;
}

export function Slide({ title, subtitle, finePrint, iconPlaceholder, imageSrc, imageAlt, currentSlide, allImages }: SlideProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Top half - Icon placeholder */}
      <div className="flex-1 flex items-center justify-center px-6 py-4">
        <div className={`aspect-[1/1.1] flex items-center justify-center relative ${currentSlide === 3 ? 'w-3/4' : 'w-3/5'}`}>
          {/* Render all images at once for instant transitions */}
          {allImages.map((image, index) => (
            <img 
              key={index}
              src={image.src} 
              alt={image.alt}
              className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-75 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
              loading="eager"
              decoding="async"
              style={{ willChange: 'opacity' }}
            />
          ))}
          {!imageSrc && (
            <span className="text-xs font-medium text-muted-foreground text-center px-2">
              {iconPlaceholder}
            </span>
          )}
        </div>
      </div>

      {/* Bottom half - Content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-[max(env(safe-area-inset-bottom),2rem)]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl display-title leading-tight">
            {title}
          </h2>
          <h3 className="subtitle text-base leading-relaxed">
            {subtitle}
          </h3>
          {finePrint && (
            <p className="text-xs text-muted-foreground/70 mt-6">
              {finePrint}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}