import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Command, CommandInput, CommandList, CommandEmpty, CommandItem } from '@/components/ui/command';
import { useAppContext } from '../../context/AppContext';
import { MapPin, ArrowLeft, Home, Plus, Minus } from 'lucide-react';
import { searchAddressAutocomplete, getPlaceDetails, GooglePlacesAddressPrediction } from '../../services/googlePlaces';

// Interface removed - now using GooglePlacesAddressPrediction from service

export function ReturnAddressScreen() {
  const { state: appState, dispatch } = useAppContext();
  const [fullName, setFullName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [apartmentUnit, setApartmentUnit] = useState('');
  const [showApartmentField, setShowApartmentField] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<GooglePlacesAddressPrediction[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [isFetchingDetails, setIsFetchingDetails] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const zipCode = appState.postcardData.zipCode || '';

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

  const handleSuggestionClick = async (suggestion: GooglePlacesAddressPrediction) => {
    // First set the description as temporary value
    setStreetAddress(suggestion.description);
    setShowSuggestions(false);
    
    // Fetch detailed address information to get complete formatted address with zip
    setIsFetchingDetails(true);
    try {
      const details = await getPlaceDetails(suggestion.place_id);
      if (details && details.formattedAddress) {
        // Use the complete formatted address from Google Places Details API
        setStreetAddress(details.formattedAddress);
      }
    } catch (error) {
      console.error('Failed to fetch place details:', error);
      // Fall back to suggestion description if details fetch fails
    } finally {
      setIsFetchingDetails(false);
    }
  };

  // Auto-expand textarea based on content
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = Math.max(48, textarea.scrollHeight) + 'px';
    }
  }, [streetAddress]);

  // Parse address components from full address string
  const parseAddressComponents = (fullAddress: string) => {
    const parts = fullAddress.split(', ');
    let city = '';
    let state = '';
    let zipCode = '';

    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const secondLastPart = parts[parts.length - 2];
      
      // Check if last part contains state and zip (e.g., "IL 62701")
      const stateZipMatch = lastPart.match(/^([A-Z]{2})\s+(\d{5}(-\d{4})?)$/);
      if (stateZipMatch) {
        state = stateZipMatch[1];
        zipCode = stateZipMatch[2];
        city = secondLastPart;
      } else if (parts.length >= 3) {
        // If format is different, try to extract from available parts
        city = secondLastPart;
        state = lastPart;
      }
    }

    return { city, state, zipCode };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fullName.trim() || !streetAddress.trim()) {
      return;
    }

    // Parse city, state, zip from the full address
    const { city, state, zipCode: parsedZip } = parseAddressComponents(streetAddress);

    // Combine street address and apartment/unit if provided
    const fullAddress = apartmentUnit.trim() 
      ? `${streetAddress.trim()}, ${apartmentUnit.trim()}`
      : streetAddress.trim();

    const userInfo = {
      fullName: fullName.trim(),
      streetAddress: fullAddress,
      city: city || '',
      state: state || '',
      zipCode: parsedZip || zipCode // Use parsed zip or fall back to original
    };

    dispatch({ 
      type: 'UPDATE_POSTCARD_DATA', 
      payload: { userInfo }
    });
    dispatch({ type: 'SET_STEP', payload: 5 });
  };

  const goBack = () => {
    dispatch({ type: 'SET_STEP', payload: 3 });
  };

  const isFormComplete = fullName.trim() && streetAddress.trim();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-20 pb-8 max-w-2xl">
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
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name *</Label>
                <Input
                  id="fullName"
                  type="text"
                  value={fullName}
                  onChange={(e) => {
                    const value = e.target.value;
                    // Capitalize first letter of each word (after spaces)
                    const capitalizedValue = value.replace(/\b\w/g, (char) => char.toUpperCase());
                    setFullName(capitalizedValue);
                  }}
                  placeholder="Enter your full name"
                  className="input-warm h-12 text-base"
                  required
                />
              </div>

              <div className="space-y-2 relative">
                <Label htmlFor="streetAddress">Street Address *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground z-10" />
                  <Textarea
                    ref={textareaRef}
                    id="streetAddress"
                    placeholder="Start typing your street address..."
                    value={streetAddress}
                    onChange={(e) => handleAddressInputChange(e.target.value)}
                    onFocus={() => {
                      if (addressSuggestions.length > 0) {
                        setShowSuggestions(true);
                      }
                    }}
                    className="input-warm pl-10 min-h-[48px] resize-none overflow-hidden"
                    autoComplete="off"
                    required
                    rows={1}
                  />
                </div>
                
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1">
                    <Command className="rounded-xl border border-border shadow-lg bg-background">
                      <CommandList className="max-h-48">
                         {isSearching || isFetchingDetails ? (
                          <div className="p-3 text-sm text-muted-foreground">
                            {isSearching ? 'Searching addresses...' : 'Getting address details...'}
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

              {!showApartmentField ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowApartmentField(true)}
                  className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto font-normal"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add apartment/unit (optional)
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Label htmlFor="apartmentUnit" className="text-sm">Apartment/Unit (Optional)</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => {
                        setShowApartmentField(false);
                        setApartmentUnit('');
                      }}
                      className="text-sm text-muted-foreground hover:text-foreground p-0 h-auto font-normal"
                    >
                      <Minus className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                  <div className="relative">
                    <Home className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="apartmentUnit"
                      type="text"
                      value={apartmentUnit}
                      onChange={(e) => setApartmentUnit(e.target.value)}
                      placeholder="Apt 5B, Unit 3, Suite 201, etc."
                      className="input-warm pl-10 h-12"
                    />
                  </div>
                </div>
              )}

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