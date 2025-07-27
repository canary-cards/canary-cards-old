import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { ProgressIndicator } from '../ProgressIndicator';
import { MapPin, ArrowLeft } from 'lucide-react';
import { searchAddresses } from '../../services/geocodio';

interface AddressSuggestion {
  formatted_address: string;
  components: {
    city?: string;
    state?: string;
    zip?: string;
  };
}

export function ReturnAddressScreen() {
  const { state, dispatch } = useAppContext();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [bestMatch, setBestMatch] = useState<string>('');
  const searchTimeoutRef = useRef<NodeJS.Timeout>();
  const inputRef = useRef<HTMLDivElement>(null);

  const zipCode = state.postcardData.zipCode || '';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAddressSearch = async (query: string) => {
    if (query.length < 3) {
      setAddressSuggestions([]);
      setShowSuggestions(false);
      setBestMatch('');
      return;
    }

    setIsSearching(true);
    try {
      const suggestions = await searchAddresses(query, zipCode);
      
      // Filter and prioritize suggestions
      const filteredSuggestions = filterAddressSuggestions(suggestions, zipCode, query);
      
      setAddressSuggestions(filteredSuggestions);
      setShowSuggestions(filteredSuggestions.length > 0);
      
      // Auto-fill with the best match if we have one
      if (filteredSuggestions.length > 0) {
        const bestAddress = filteredSuggestions[0].formatted_address;
        setBestMatch(bestAddress);
        // Auto-fill if this is a high-quality street address match
        const isCompleteStreetAddress = /^\d+\s+.+\s+(St|Ave|Rd|Dr|Ln|Blvd|Way|Ct|Pl|Cir|Pkwy|Ter)/i.test(bestAddress);
        if (isCompleteStreetAddress) {
          setStreetAddress(bestAddress);
        }
      } else {
        setBestMatch('');
      }
    } catch (error) {
      console.error('Address search failed:', error);
      setAddressSuggestions([]);
      setShowSuggestions(false);
      setBestMatch('');
    } finally {
      setIsSearching(false);
    }
  };

  const filterAddressSuggestions = (suggestions: AddressSuggestion[], targetZip: string, query: string) => {
    // Separate complete street addresses from partial/generic results
    const completeAddresses = suggestions.filter(suggestion => {
      const formatted = suggestion.formatted_address;
      
      // Check if this is a complete street address with high accuracy
      const hasHouseNumber = /^\d+\s/.test(formatted);
      const hasStreetSuffix = /\s+(St|Ave|Rd|Dr|Ln|Blvd|Way|Ct|Pl|Cir|Pkwy|Ter|Street|Avenue|Road|Drive|Lane|Boulevard|Circle|Parkway|Terrace)/i.test(formatted);
      const hasCityState = /,\s*[A-Z]{2}\s*\d{5}/.test(formatted);
      
      // Check if it's in the target zip code
      const matchesZip = suggestion.components?.zip === targetZip || 
                        formatted.includes(targetZip);
      
      return hasHouseNumber && hasStreetSuffix && hasCityState && matchesZip;
    });

    const partialStreetAddresses = suggestions.filter(suggestion => {
      const formatted = suggestion.formatted_address;
      
      // Check if this is a street address (has house number and street name)
      const hasHouseNumber = /^\d+\s/.test(formatted);
      const hasStreetName = formatted.includes(' ') && 
                           !formatted.match(/^[^,]+,\s*[A-Z]{2}\s*\d{5}$/); // Not just "City, ST ZIP"
      
      // Check if it's in the target zip code
      const matchesZip = suggestion.components?.zip === targetZip || 
                        formatted.includes(targetZip);
      
      // Additional check: should not be a generic result like "Sacramento, CA 95831"
      const isNotGenericCity = !formatted.match(/^[^,]+,\s*[A-Z]{2}\s*\d{5}$/);
      
      return hasHouseNumber && hasStreetName && matchesZip && isNotGenericCity && !completeAddresses.includes(suggestion);
    });

    const genericResults = suggestions.filter(suggestion => {
      const formatted = suggestion.formatted_address;
      
      // Generic city/state/zip pattern
      const isGenericCity = formatted.match(/^[^,]+,\s*[A-Z]{2}\s*\d{5}$/);
      const matchesZip = suggestion.components?.zip === targetZip || 
                        formatted.includes(targetZip);
      
      return isGenericCity && matchesZip;
    });

    // Prioritize complete addresses first, then partial street addresses
    if (completeAddresses.length > 0) {
      return completeAddresses.concat(partialStreetAddresses);
    }
    
    if (partialStreetAddresses.length > 0) {
      return partialStreetAddresses;
    }
    
    // Only show generic results if the query doesn't look like it's trying to be a house number
    const queryLooksLikeHouseNumber = /^\d+/.test(query.trim());
    
    return queryLooksLikeHouseNumber ? [] : genericResults;
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

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    setStreetAddress(suggestion.formatted_address);
    setBestMatch(suggestion.formatted_address);
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
    dispatch({ type: 'SET_STEP', payload: 4 });
  };

  const goBack = () => {
    dispatch({ type: 'SET_STEP', payload: 2 });
  };

  const isFormComplete = firstName.trim() && lastName.trim() && streetAddress.trim();

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <ProgressIndicator currentStep={2} totalSteps={5} />
        
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

              <div className="space-y-2 relative" ref={inputRef}>
                <Label htmlFor="streetAddress">Return Address *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-4 w-4 h-4 text-muted-foreground" />
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
                    className="input-warm pl-10 py-3 resize-none overflow-hidden"
                    autoComplete="off"
                    required
                    rows={1}
                    style={{
                      height: 'auto',
                      minHeight: '48px',
                      lineHeight: '1.5'
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      const scrollHeight = target.scrollHeight;
                      const lineHeight = parseInt(getComputedStyle(target).lineHeight);
                      const paddingTop = parseInt(getComputedStyle(target).paddingTop);
                      const paddingBottom = parseInt(getComputedStyle(target).paddingBottom);
                      target.style.height = Math.max(48, scrollHeight + paddingTop + paddingBottom) + 'px';
                    }}
                  />
                </div>
                
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-background border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto">
                    {isSearching ? (
                      <div className="p-3 text-sm text-muted-foreground">
                        Searching addresses...
                      </div>
                    ) : (
                      addressSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          type="button"
                          className="w-full text-left p-3 hover:bg-accent hover:text-accent-foreground border-b border-border last:border-b-0 transition-colors"
                          onClick={() => handleSuggestionClick(suggestion)}
                        >
                          <div className="text-sm">{suggestion.formatted_address}</div>
                        </button>
                      ))
                    )}
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