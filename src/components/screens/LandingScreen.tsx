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
import { MapPin, Users, Bot, PenTool } from 'lucide-react';

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
    
    // Simulate API call to Geocodio
    setTimeout(() => {
      // Mock representatives data
      const mockReps: Representative[] = [
        {
          id: '1',
          name: 'John Smith',
          district: '5th District',
          city: 'Washington',
          state: 'DC',
          photo: '/placeholder.svg'
        },
        // Randomly add a second rep for some zip codes
        ...(Math.random() > 0.7 ? [{
          id: '2',
          name: 'Jane Doe',
          district: '6th District',
          city: 'Washington',
          state: 'DC',
          photo: '/placeholder.svg'
        }] : [])
      ];
      
      setRepresentatives(mockReps);
      setIsSearching(false);
      
      if (mockReps.length === 1) {
        setSelectedRep(mockReps[0]);
      }
    }, 1500);
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
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <ProgressIndicator currentStep={1} totalSteps={5} />
        
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Make Your Voice Heard
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            Send personalized, handwritten postcards to your representatives
          </p>
          
          {/* Social Validation Counter */}
          <Card className="max-w-md mx-auto mb-8">
            <CardContent className="flex items-center justify-center p-4">
              <Users className="w-5 h-5 text-secondary mr-2" />
              <span className="text-sm">
                This week, <strong className="text-primary">{socialCounter} people</strong> sent personalized postcards to their representatives
              </span>
            </CardContent>
          </Card>
        </div>

        {/* Key Messaging */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <Card className="p-6">
            <div className="flex items-start space-x-3">
              <PenTool className="w-6 h-6 text-secondary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Real Impact</h3>
                <p className="text-sm text-muted-foreground">
                  Less than 50 personalized messages are enough to get a congressperson's attention, according to the bipartisan Congressional Management Foundation.
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start space-x-3">
              <Bot className="w-6 h-6 text-secondary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-semibold mb-2">Handwritten by Robots</h3>
                <p className="text-sm text-muted-foreground">
                  We use robots to handwrite with real pen and paper what you write here and send it to your congressperson.
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Zip Code Form */}
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6">
            <form onSubmit={handleZipSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode" className="text-base font-medium">
                  Enter your zip code to find your representative
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
                    className="pl-10"
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
                className="w-full h-12"
                disabled={isSearching || !zipCode}
              >
                {isSearching ? 'Finding Representatives...' : 'Find My Representative'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Representatives Results */}
        {isSearching && (
          <div className="max-w-md mx-auto mt-6">
            <Skeleton className="h-24 w-full" />
          </div>
        )}

        {representatives.length > 0 && !isSearching && (
          <div className="max-w-md mx-auto mt-6 space-y-4">
            {representatives.length > 1 && (
              <p className="text-center text-sm text-muted-foreground">
                Hey, it looks like there are actually two representatives in your zip code. Please select one:
              </p>
            )}
            
            {representatives.map((rep) => (
              <Card 
                key={rep.id} 
                className={`cursor-pointer transition-all duration-200 slide-in ${
                  selectedRep?.id === rep.id 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:shadow-md'
                }`}
                onClick={() => handleRepSelect(rep)}
              >
                <CardContent className="flex items-center p-4">
                  <div className="w-16 h-16 rounded-full bg-muted mr-4 flex-shrink-0 overflow-hidden">
                    <img 
                      src={rep.photo} 
                      alt={rep.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                  </div>
                  <div className="flex-grow">
                    <h3 className="font-semibold">{rep.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {rep.district} • {rep.city}, {rep.state}
                    </p>
                  </div>
                  {selectedRep?.id === rep.id && (
                    <Badge variant="secondary" className="ml-2">
                      Selected
                    </Badge>
                  )}
                </CardContent>
              </Card>
            ))}
            
            {selectedRep && (
              <Button 
                onClick={handleContinue}
                className="w-full h-12 mt-4"
              >
                Continue
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}