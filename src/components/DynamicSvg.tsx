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
      <div className={`animate-pulse bg-muted rounded ${className}`} style={{ width, height }}>
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
          Loading...
        </div>
      </div>
    );
  }

  // If there's an error or no SVG found, use fallback if provided
  const src = error || !svgUrl ? fallbackSrc : svgUrl;

  if (!src) {
    return (
      <div className={`bg-muted rounded flex items-center justify-center text-muted-foreground text-sm ${className}`} style={{ width, height }}>
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
    />
  );
};