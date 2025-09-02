import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Representative } from '@/types';

interface RepresentativeCardProps {
  representative: Representative;
  isSelected?: boolean;
  showBadge?: boolean;
  density?: 'compact' | 'normal';
  onClick?: () => void;
}

export function RepresentativeCard({ 
  representative, 
  isSelected = false, 
  showBadge = false,
  density = 'normal',
  onClick 
}: RepresentativeCardProps) {
  const isCompact = density === 'compact';
  
  return (
    <Card 
      className={`cursor-pointer transition-all duration-200 bg-card border border-border shadow-sm ${
        isSelected 
          ? 'ring-2 ring-primary bg-card border-primary shadow-md' 
          : 'hover:shadow-md border-border/60'
      } ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      onClick={onClick}
    >
      <CardContent className={`flex items-center ${isCompact ? 'p-3' : 'p-6'}`}>
        <div className={`${isCompact ? 'w-14 h-14' : 'w-20 h-20'} rounded-lg bg-muted mr-3 md:mr-4 flex-shrink-0 overflow-hidden relative`}>
          <img 
            src={representative.photo} 
            alt={representative.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          {showBadge && isSelected && (
            <Badge variant="accent" className="absolute -top-1 -right-1 text-xs whitespace-nowrap scale-75">
              My Rep
            </Badge>
          )}
        </div>
        <div className="flex-grow min-w-0">
          <h3 className={`text-primary font-semibold ${isCompact ? 'text-xs' : 'text-sm md:text-base'} truncate`}>
            {representative.name}
          </h3>
          <p className={`text-muted-foreground ${isCompact ? 'text-xs' : 'text-xs md:text-sm'} truncate`}>
            {representative.district} • {representative.city}, {representative.state}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}