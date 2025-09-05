import { useDynamicSvg } from '@/hooks/useDynamicSvg';

interface DynamicSvgProps {
  assetName: string;
  fallbackSrc?: string;
  className?: string;
  alt?: string;
  width?: number;
  height?: number;
}

export const DynamicSvg = ({ 
  assetName, 
  fallbackSrc, 
  className, 
  alt, 
  width, 
  height 
}: DynamicSvgProps) => {
  const { svgUrl, loading, error } = useDynamicSvg(assetName);

  if (loading) {
    return (
      <div 
        className={`animate-pulse bg-muted/20 rounded flex items-center justify-center ${className}`} 
        style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
      >
        <div className="text-muted-foreground text-xs opacity-50">
          Loading...
        </div>
      </div>
    );
  }

  // If there's an error or no SVG found, use fallback if provided
  const src = error || !svgUrl ? fallbackSrc : svgUrl;

  if (!src) {
    return (
      <div 
        className={`bg-muted/20 rounded flex items-center justify-center text-muted-foreground text-xs ${className}`} 
        style={{ width: width ? `${width}px` : undefined, height: height ? `${height}px` : undefined }}
      >
        Asset not found: {assetName}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || assetName}
      className={className}
      style={{ 
        width: width ? `${width}px` : 'auto', 
        height: height ? `${height}px` : 'auto',
        objectFit: 'contain',
        display: 'block'
      }}
    />
  );
};