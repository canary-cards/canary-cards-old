import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { RepresentativeCard } from '@/components/rep/RepresentativeCard';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useAppContext } from '../../context/AppContext';
import { ProgressIndicator } from '../ProgressIndicator';
import { SharedBanner } from '../SharedBanner';
import { Representative } from '../../types';
import { lookupRepresentatives } from '../../services/geocodio';
import { MapPin, Users, Bot, PenTool, ArrowRight, Heart, Target } from 'lucide-react';
import { Logo } from '../Logo';
import heroImage from '@/assets/civic-hero-mobile.jpg';
export function LandingScreen() {
  const {
    state,
    dispatch
  } = useAppContext();
  const [zipCode, setZipCode] = useState('');
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedRep, setSelectedRep] = useState<Representative | null>(null);
  const [showSharedDialog, setShowSharedDialog] = useState(false);
  const [sharedByName, setSharedByName] = useState('');

  // Refs for auto-scrolling
  const resultsRef = useRef<HTMLDivElement>(null);
  const continueButtonRef = useRef<HTMLButtonElement>(null);

  // Check for shared link on mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sharedBy = urlParams.get('shared_by');
    if (sharedBy) {
      setSharedByName(decodeURIComponent(sharedBy));
      setShowSharedDialog(true);
      // Don't remove the query param - keep it for persistence
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
      setSearchError('Hmm. That doesn\'t look like a valid zip code. Please try again.');
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-scroll when representatives are loaded
  useEffect(() => {
    if (representatives.length > 0 && resultsRef.current) {
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 300);
    }
  }, [representatives]);

  // Auto-scroll when representative is selected
  useEffect(() => {
    if (selectedRep && continueButtonRef.current) {
      setTimeout(() => {
        continueButtonRef.current?.scrollIntoView({
          behavior: 'smooth',
          block: 'center'
        });
      }, 300);
    }
  }, [selectedRep]);
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
      dispatch({
        type: 'SET_STEP',
        payload: 2
      });
    }
  };
  return <>
      {/* Shared Link Banner */}
      {showSharedDialog && <SharedBanner sharedBy={sharedByName} onDismiss={() => setShowSharedDialog(false)} />}

      <div className={`min-h-screen bg-background ${showSharedDialog ? 'pt-16' : ''}`}>
      <div className="container mx-auto px-4 py-4 max-w-2xl">
        {/* Logo Section */}
        <div className="flex justify-center mb-6">
          <Logo />
        </div>
        
        {/* Mobile-First Hero Section */}
        <div className="text-center mb-8">
          {/* Hero Text */}
          <div className="w-full mb-4 p-6">
            <h2 className="text-2xl md:text-3xl display-title leading-tight mb-3">
              Make Your Voice Heard in Washington D.C.
            </h2>
            <h3 className="subtitle text-base mb-2 leading-relaxed">
              You craft a postcard, robots handwrite and mail it, your rep reads it
            </h3>
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
                  <Input id="zipCode" type="text" inputMode="numeric" pattern="[0-9]{5}" placeholder="12345" value={zipCode} onChange={e => {
                    const value = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setZipCode(value);
                    setSearchError('');
                  }} className="pl-10 pr-10 h-12 text-center text-lg md:text-base" style={{
                    textAlign: 'center',
                    paddingLeft: '2.5rem',
                    paddingRight: '2.5rem'
                  }} maxLength={5} />
                </div>
                {searchError && <p className="text-sm text-destructive">
                    {searchError}
                    {searchError.includes('valid')}
                  </p>}
              </div>
              
              <Button type="submit" className="w-full h-12 text-base font-medium" disabled={isSearching || !zipCode}>
                {isSearching ? <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    Finding Your Rep...
                  </> : <>
                    Find My Representative
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </>}
              </Button>
            </form>
          </CardContent>
        </Card>

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

        {/* Representatives Results */}
        {isSearching && <div className="mb-6">
            <Skeleton className="h-20 w-full rounded-xl" />
          </div>}

        {representatives.length > 0 && !isSearching && <div ref={resultsRef} className="mb-6 space-y-4">
            {representatives.length > 1 && <p className="text-center text-sm text-muted-foreground px-4">
                Multiple representatives found. Select yours:
              </p>}
            
            {representatives.map(rep => <RepresentativeCard key={rep.id} representative={rep} isSelected={selectedRep?.id === rep.id} showBadge={true} onClick={() => handleRepSelect(rep)} />)}
            
            {selectedRep && <Button ref={continueButtonRef} onClick={handleContinue} className="w-full h-12 text-base font-medium">
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>}
          </div>}
      </div>
    </div>
    </>;
}