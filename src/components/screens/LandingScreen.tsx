import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAppContext } from '../../context/AppContext';
import { ProgressIndicator } from '../ProgressIndicator';
import { Representative } from '../../types';
import { lookupRepresentatives } from '../../services/geocodio';
import { MapPin, Users, Bot, PenTool, ArrowRight, Mail, Heart, Target } from 'lucide-react';

import heroImage from '@/assets/civic-hero-mobile.jpg';

export function LandingScreen() {
  const { state, dispatch } = useAppContext();
  const [zipCode, setZipCode] = useState('');
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedRep, setSelectedRep] = useState<Representative | null>(null);
  const [showSharedDialog, setShowSharedDialog] = useState(false);
  const [sharedByName, setSharedByName] = useState('');

  // Check for shared link on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedBy = urlParams.get('shared_by');
    
    if (sharedBy) {
      setSharedByName(decodeURIComponent(sharedBy));
      setShowSharedDialog(true);
      
      // Clean up URL without causing navigation
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  const validateZipCode = (zip: string) => {
    return /^\d{5}$/.test(zip);
  };

  const handleZipSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateZipCode(zipCode)) {
      setSearchError('Please enter a valid 5-digit zip code');
      return;
    }

    setIsSearching(true);
    setSearchError('');
    setShowSharedDialog(false); // Hide the shared banner when user starts searching
    
    try {
      const reps = await lookupRepresentatives(zipCode);
      setRepresentatives(reps);
      
      if (reps.length === 1) {
        setSelectedRep(reps[0]);
      }
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : 'Failed to lookup representatives. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleRepSelect = (rep: Representative) => {
    setSelectedRep(rep);
  };

  const handleContinue = () => {
    if (selectedRep) {
      dispatch({ 
        type: 'UPDATE_POSTCARD_DATA', 
        payload: { 
          zipCode, 
          representative: selectedRep 
        }
      });
      dispatch({ type: 'SET_STEP', payload: 2 });
    }
  };

  return (
    <>
      {/* Shared Link Banner */}
      {showSharedDialog && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-primary text-primary-foreground px-4 py-3 shadow-md">
          <div className="container mx-auto max-w-2xl relative">
            <div className="flex items-center justify-center gap-2">
              <Heart className="h-4 w-4 text-primary-foreground/80" />
              <span className="text-sm font-medium">
                Shared with you by <strong>{sharedByName}</strong>
              </span>
            </div>
            <button
              onClick={() => setShowSharedDialog(false)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-primary-foreground/80 hover:text-primary-foreground transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      <div className={`min-h-screen bg-background ${showSharedDialog ? 'pt-16' : ''}`}>
      <div className="container mx-auto px-4 py-4 max-w-2xl">
        {/* Branding Section */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">InkImpact</h1>
          </div>
          
        </div>
        
        {/* Mobile-First Hero Section */}
        <div className="text-center mb-3">
          {/* Hero Text */}
          <div className="w-full mb-4 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5">
            
            <h2 className="text-2xl md:text-3xl font-bold leading-tight mb-3 text-foreground">
              Make Your Voice Heard in Washington D.C.
            </h2>
            <p className="text-base text-muted-foreground mb-2 leading-relaxed">
              You craft a postcard, robots handwrite and mail it, your rep reads it
            </p>
          </div>

          {/* Impact Card */}
          <div className="w-full mb-4 p-4 rounded-xl bg-gradient-to-br from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20 border border-green-200/30 dark:border-green-800/30 relative">
            <div className="text-sm text-foreground text-center">
              <p className="text-base font-medium mb-1">
                Just 50 personalized postcards can influence a congressperson's vote
              </p>
              <p className="text-xs text-muted-foreground italic">
                — Congressional Management Foundation study
              </p>
            </div>
          </div>
        </div>

        {/* Primary CTA - Zip Code Form (Above the fold) */}
        <Card className="mb-6 border-primary/20 shadow-sm">
          <CardContent className="p-4 md:p-6">
            <form onSubmit={handleZipSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode" className="text-sm md:text-base font-medium text-center block">
                  Enter your zip code to get started
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="zipCode"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]{5}"
                    placeholder="12345"
                    value={zipCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                      setZipCode(value);
                      setSearchError('');
                    }}
                    className="pl-10 pr-10 h-12 text-center text-lg md:text-base"
                    style={{ textAlign: 'center', paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                    maxLength={5}
                  />
                </div>
                {searchError && (
                  <p className="text-sm text-destructive">
                    {searchError}
                    {searchError.includes('valid') && (
                      <span className="block mt-1 text-muted-foreground">
                        Try a nearby zip code
                      </span>
                    )}
                  </p>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-medium"
                disabled={isSearching || !zipCode}
              >
                {isSearching ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Finding Your Rep...
                  </>
                ) : (
                  <>
                    Find My Representative
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Representatives Results */}
        {isSearching && (
          <div className="mb-6">
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>
        )}

        {representatives.length > 0 && !isSearching && (
          <div className="mb-6 space-y-4">
            {representatives.length > 1 && (
              <p className="text-center text-sm text-muted-foreground px-4">
                Multiple representatives found. Select yours:
              </p>
            )}
            
            {representatives.map((rep) => (
              <Card 
                key={rep.id} 
                className={`cursor-pointer transition-all duration-200 ${
                  selectedRep?.id === rep.id 
                    ? 'ring-2 ring-primary bg-primary/5 border-primary/50' 
                    : 'hover:shadow-md border-border/50'
                }`}
                onClick={() => handleRepSelect(rep)}
              >
                <CardContent className="flex items-center p-4">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-muted mr-3 md:mr-4 flex-shrink-0 overflow-hidden">
                    <img 
                      src={rep.photo} 
                      alt={rep.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <div className="flex-grow min-w-0">
                    <h3 className="font-semibold text-sm md:text-base truncate">{rep.name}</h3>
                    <p className="text-xs md:text-sm text-muted-foreground truncate">
                      {rep.district} • {rep.city}, {rep.state}
                    </p>
                  </div>
                  {selectedRep?.id === rep.id && (
                    <Badge variant="secondary" className="ml-2 text-xs bg-green-100 text-green-800 border-green-200">
                      My Rep
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {selectedRep && (
              <Button 
                onClick={handleContinue}
                className="w-full h-12 text-base font-medium"
              >
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
    </>
  );
}