import React from 'react';

interface SlideProps {
  title: string;
  subtitle: string;
  finePrint?: string;
  iconPlaceholder: string;
}

export function Slide({ title, subtitle, finePrint, iconPlaceholder }: SlideProps) {
  return (
    <div className="h-full flex flex-col">
      {/* Top half - Icon placeholder */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <div 
          className="w-3/5 aspect-[1/1.1] bg-muted border border-border rounded-2xl flex items-center justify-center"
          style={{ backgroundColor: 'hsl(var(--muted))' }}
        >
          <span className="text-xs font-medium text-muted-foreground text-center px-2">
            {iconPlaceholder}
          </span>
        </div>
      </div>

      {/* Bottom half - Content */}
      <div className="flex-1 flex flex-col justify-center px-6 pb-[max(env(safe-area-inset-bottom),2rem)]">
        <div className="text-center space-y-4">
          <h2 className="text-2xl display-title leading-tight">
            {title}
          </h2>
          <p className="text-base body-text text-muted-foreground leading-relaxed">
            {subtitle}
          </p>
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