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
        <div className={`aspect-[1/1.1] flex items-center justify-center relative transition-[width] duration-200 ease-in-out ${currentSlide === 3 ? 'w-5/6' : 'w-2/3'}`}>
          {/* Render all images at once for smooth transitions */}
          {allImages.map((image, index) => (
            <img 
              key={index}
              src={image.src} 
              alt={image.alt}
              className={`absolute inset-0 w-full h-full object-contain transition-[opacity,transform] duration-200 ease-in-out motion-reduce:transition-none motion-reduce:transform-none pointer-events-none select-none ${
                index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
              }`}
              loading="eager"
              decoding="async"
              style={{ willChange: 'opacity, transform' }}
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