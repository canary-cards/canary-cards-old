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
        className={`animate-pulse bg-muted/20 rounded ${className}`} 
        style={{ width: width || 'auto', height: height || 'auto' }}
      >
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-xs opacity-50">
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
        style={{ width: width || 'auto', height: height || 'auto' }}
      >
        No image
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt || assetName}
      className={className}
      width={width}
      height={height}
      style={{ 
        width: width || 'auto', 
        height: height || 'auto',
        objectFit: 'contain'
      }}
    />
  );
};