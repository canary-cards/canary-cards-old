import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';
import { Representative } from '@/types';

interface LawmakerSelectCardProps {
  lawmaker: Representative;
  isSelected: boolean;
  isDisabled?: boolean;
  price: string;
  valueText: string;
  supportText: string;
  onSelectionChange?: (checked: boolean) => void;
  showTooltip?: boolean;
  tooltipContent?: string;
  className?: string;
}

export function LawmakerSelectCard({
  lawmaker,
  isSelected,
  isDisabled = false,
  price,
  valueText,
  supportText,
  onSelectionChange,
  showTooltip = false,
  tooltipContent,
  className = ""
}: LawmakerSelectCardProps) {
  const handleCardClick = () => {
    if (!isDisabled && onSelectionChange) {
      onSelectionChange(!isSelected);
    }
  };

  return (
    <Card 
      className={`transition-all duration-200 cursor-pointer ${
        isSelected 
          ? 'border-2 border-primary bg-primary/5 shadow-md' 
          : 'border border-border bg-card hover:bg-muted/20'
      } ${isDisabled ? 'cursor-default' : ''} ${className}`}
      onClick={handleCardClick}
    >
      <CardContent className="p-4">
        <div className="space-y-3">
          {/* Header Row - Photo, Name, Action */}
          <div className="flex items-start gap-4">
            {/* Photo */}
            <div className="w-12 h-12 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              {lawmaker.photo ? (
                <img 
                  src={lawmaker.photo} 
                  alt={lawmaker.name} 
                  className="w-full h-full object-cover" 
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-primary text-sm font-medium">
                  {lawmaker.name.split(' ').map(n => n[0]).join('')}
                </div>
              )}
            </div>

            {/* Name and Title */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-semibold text-foreground text-sm truncate">
                  {lawmaker.name}
                </h4>
                {showTooltip && tooltipContent && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 text-muted-foreground flex-shrink-0" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>{tooltipContent}</p>
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {lawmaker.type} • {lawmaker.state}
                {lawmaker.district && ` - District ${lawmaker.district}`}
              </p>
            </div>

            {/* Action Row - Checkbox and Price */}
            <div className="flex items-center gap-3 flex-shrink-0">
              <Badge variant="secondary" className="text-xs font-medium">
                {price}
              </Badge>
              <Checkbox 
                checked={isSelected} 
                disabled={isDisabled}
                onCheckedChange={onSelectionChange}
                onClick={(e) => e.stopPropagation()}
                className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
            </div>
          </div>

          {/* Value Proposition */}
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground leading-tight">
              {valueText}
            </p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {supportText}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}