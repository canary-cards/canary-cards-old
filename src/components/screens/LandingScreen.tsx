import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useAppContext } from '../../context/AppContext';
import { ProgressIndicator } from '../ProgressIndicator';
import { Representative } from '../../types';
import { lookupRepresentatives } from '../../services/geocodio';
import { MapPin, Users, Bot, PenTool, ArrowRight, Mail } from 'lucide-react';
import { ThemeToggle } from '../ThemeToggle';
import heroImage from '@/assets/civic-hero-mobile.jpg';

export function LandingScreen() {
  const { state, dispatch } = useAppContext();
  const [zipCode, setZipCode] = useState('');
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [selectedRep, setSelectedRep] = useState<Representative | null>(null);
  const [socialCounter, setSocialCounter] = useState(47);

  // Animate the social counter
  useEffect(() => {
    const interval = setInterval(() => {
      setSocialCounter(prev => {
        const change = Math.random() > 0.8 ? (Math.random() > 0.5 ? 1 : -1) : 0;
        return Math.max(40, prev + change);
      });
    }, 5000);
    
    return () => clearInterval(interval);
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
      dispatch({ type: 'SET_STEP', payload: 3 });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 max-w-2xl">
        {/* Branding Section */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary-foreground" />
            </div>
            <h1 className="text-xl font-bold text-foreground">InkImpact</h1>
          </div>
          <ThemeToggle />
        </div>
        
        {/* Mobile-First Hero Section */}
        <div className="text-center mb-3">
          {/* Hero Text */}
          <div className="w-full mb-4 p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-secondary/5">
            <p className="text-xs text-muted-foreground mb-2 tracking-wide uppercase">Civic Engagement</p>
            <h2 className="text-2xl md:text-3xl font-light leading-tight mb-4 text-foreground">
              <span className="font-light">Handwritten</span> <span className="font-normal">Postcards</span>
              <br />
              <span className="font-light">to Your Reps</span>
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Send authentic, handwritten postcards to your elected representatives. 
              Real ink, real impact, delivered directly to their offices.
            </p>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold text-foreground mb-2">
            Make Your Voice Heard
          </h1>
          
          {/* Compact Social Proof */}
          <div className="inline-flex items-center gap-2 px-3 py-2 bg-primary/5 rounded-full text-xs md:text-sm mb-6">
            <Users className="w-4 h-4 text-primary" />
            <span><strong className="text-primary">{socialCounter}</strong> postcards sent this week</span>
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
                    placeholder="12345"
                    value={zipCode}
                    onChange={(e) => {
                      setZipCode(e.target.value);
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

        {/* Compact Value Props - Below the fold */}
        <div className="space-y-3 mt-8">
          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
            <PenTool className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-sm mb-1">Real Impact</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Less than 50 personalized messages get a congressperson's attention.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/30">
            <Bot className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-sm mb-1">Handwritten by Robots</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                We use robots to handwrite with real pen and paper.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}