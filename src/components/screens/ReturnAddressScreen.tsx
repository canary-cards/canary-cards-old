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
      return;
    }

    setIsSearching(true);
    try {
      const suggestions = await searchAddresses(query, zipCode);
      setAddressSuggestions(suggestions);
      setShowSuggestions(suggestions.length > 0);
    } catch (error) {
      console.error('Address search failed:', error);
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

  const handleSuggestionClick = (suggestion: AddressSuggestion) => {
    setStreetAddress(suggestion.formatted_address);
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
                  <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
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
                    className="input-warm pl-10 min-h-[48px] resize-none"
                    autoComplete="off"
                    required
                    rows={1}
                    style={{
                      height: 'auto',
                      minHeight: '48px'
                    }}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = Math.max(48, target.scrollHeight) + 'px';
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