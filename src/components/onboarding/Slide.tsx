import React from 'react';

interface SlideProps {
  title: string;
  subtitle: string;
  finePrint?: string;
  iconPlaceholder: string;
  imageSrc?: string;
  imageAlt?: string;
}

export function Slide({ title, subtitle, finePrint, iconPlaceholder, imageSrc, imageAlt }: SlideProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Top half - Icon placeholder */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div className="w-3/5 aspect-[1/1.1] flex items-center justify-center">
          {imageSrc ? (
            <img 
              src={imageSrc} 
              alt={imageAlt || iconPlaceholder}
              className="w-full h-full object-contain"
            />
          ) : (
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