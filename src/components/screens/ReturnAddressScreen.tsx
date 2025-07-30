import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command';
import { useAppContext } from '../../context/AppContext';
import { ProgressIndicator } from '../ProgressIndicator';
import { MapPin, ArrowLeft } from 'lucide-react';
import { searchAddressAutocomplete, GooglePlacesAddressPrediction } from '../../services/googlePlaces';

// Interface removed - now using GooglePlacesAddressPrediction from service

export function ReturnAddressScreen() {
  const { state, dispatch } = useAppContext();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<GooglePlacesAddressPrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const zipCode = state.postcardData.zipCode || '';

  const handleAddressSearch = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);
    try {
      const suggestions = await searchAddressAutocomplete(query, zipCode);
      setAddressSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Address search failed:', error);
      setAddressSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddressInputChange = (value: string) => {
    setStreetAddress(value);
    
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    searchTimeoutRef.current = setTimeout(() => {
      handleAddressSearch(value);
    }, 300);
  };

  const handleSuggestionClick = (suggestion: GooglePlacesAddressPrediction) => {
    setStreetAddress(suggestion.description);
    setShowSuggestions(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!firstName.trim() || !lastName.trim() || !streetAddress.trim()) {
      return;
    }

    const userInfo = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      streetAddress: streetAddress.trim(),
      city: '', // Will be populated from selected address
      state: '', // Will be populated from selected address
      zipCode: zipCode
    };

    dispatch({ 
      type: 'UPDATE_POSTCARD_DATA', 
      payload: { userInfo }
    });
    dispatch({ type: 'SET_STEP', payload: 3 });
  };

  const goBack = () => {
    dispatch({ type: 'SET_STEP', payload: 1 });
  };

  const isFormComplete = firstName.trim() && lastName.trim() && streetAddress.trim();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <ProgressIndicator currentStep={2} totalSteps={6} />
        
        <Card className="card-warm">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Return Address Information
              </h1>
              <p className="text-muted-foreground">
                We need your return address for the postcard so your representative knows it came from a constituent.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="input-warm"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="input-warm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="streetAddress">Return Address *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground z-10" />
                  <Textarea
                    id="streetAddress"
                    placeholder="Start typing your address..."
                    value={streetAddress}
                    onChange={(e) => handleAddressInputChange(e.target.value)}
                    onFocus={() => {
                      if (addressSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    className="input-warm pl-10 resize-none"
                    autoComplete="off"
                    required
                    rows={2}
                  />
                </div>
                
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1">
                    <Command className="rounded-xl border border-border shadow-lg bg-background">
                      <CommandList className="max-h-48">
                        {isSearching ? (
                          <div className="p-3 text-sm text-muted-foreground">
                            Searching addresses...
                          </div>
                        ) : (
                          <>
                            {addressSuggestions.length === 0 ? (
                              <CommandEmpty>No addresses found</CommandEmpty>
                            ) : (
                              addressSuggestions.map((suggestion, index) => (
                                <CommandItem
                                  key={suggestion.place_id || index}
                                  onSelect={() => handleSuggestionClick(suggestion)}
                                  className="cursor-pointer"
                                >
                                  <div>
                                    <div className="font-medium text-sm">
                                      {suggestion.structured_formatting.main_text}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {suggestion.structured_formatting.secondary_text}
                                    </div>
                                  </div>
                                </CommandItem>
                              ))
                            )}
                          </>
                        )}
                      </CommandList>
                    </Command>
                  </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  className="button-warm"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
                
                <Button
                  type="submit"
                  className="flex-1 button-warm h-12"
                  disabled={!isFormComplete}
                >
                  Continue
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}