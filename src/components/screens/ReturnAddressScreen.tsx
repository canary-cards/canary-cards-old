import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { ProgressIndicator } from '../ProgressIndicator';
import { UserInfo } from '../../types';
import { MapPin, CheckCircle, ArrowLeft } from 'lucide-react';
import { validateAddress } from '../../services/geocodio';

export function ReturnAddressScreen() {
  const { state, dispatch } = useAppContext();
  const [userInfo, setUserInfo] = useState<UserInfo>({
    firstName: '',
    lastName: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
  });
  const [isValidating, setIsValidating] = useState(false);
  const [validationError, setValidationError] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleInputChange = (field: keyof UserInfo, value: string) => {
    setUserInfo(prev => ({ ...prev, [field]: value }));
    setValidationError('');
    setIsValid(false);
  };

  const handleAddressValidation = async (address: string) => {
    if (!address.trim()) return;
    
    setIsValidating(true);
    try {
      const result = await validateAddress(address);
      const components = result.components;
      
      setUserInfo(prev => ({
        ...prev,
        streetAddress: address,
        city: components.city || '',
        state: components.state || '',
        zipCode: components.zip || '',
      }));
      
      // Check if zip matches representative's district
      if (components.zip !== state.postcardData.zipCode) {
        setValidationError(
          `The address you entered doesn't appear to be in ${state.postcardData.representative?.name}'s district. Please verify your address.`
        );
      } else {
        setIsValid(true);
      }
    } catch (error) {
      setValidationError('Unable to validate this address. Please check and try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const isFormComplete = Object.values(userInfo).every(value => value.trim() !== '');
    
    if (!isFormComplete) {
      setValidationError('Please fill in all required fields');
      return;
    }

    dispatch({ 
      type: 'UPDATE_POSTCARD_DATA', 
      payload: { userInfo }
    });
    dispatch({ type: 'SET_STEP', payload: 4 });
  };

  const goBack = () => {
    dispatch({ type: 'SET_STEP', payload: 2 });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <ProgressIndicator currentStep={2} totalSteps={5} />
        
        <Card className="card-warm">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Enter Your Information
              </h1>
              <p className="text-muted-foreground">
                Representatives read letters from their constituents. We need to prove to them that you are one.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    type="text"
                    value={userInfo.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="input-warm"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    type="text"
                    value={userInfo.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="input-warm"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="streetAddress">Street Address *</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="streetAddress"
                    type="text"
                    placeholder="123 Main Street"
                    value={userInfo.streetAddress}
                    onChange={(e) => handleInputChange('streetAddress', e.target.value)}
                    onBlur={(e) => handleAddressValidation(e.target.value)}
                    className="input-warm pl-10"
                    required
                  />
                  {isValid && (
                    <CheckCircle className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-secondary" />
                  )}
                </div>
                {isValidating && (
                  <p className="text-sm text-muted-foreground">
                    Validating address...
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    type="text"
                    value={userInfo.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="input-warm"
                    readOnly={isValid}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    type="text"
                    value={userInfo.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className="input-warm"
                    readOnly={isValid}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="zipCode">ZIP Code</Label>
                  <Input
                    id="zipCode"
                    type="text"
                    value={userInfo.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    className="input-warm"
                    readOnly={isValid}
                  />
                </div>
              </div>

              {validationError && (
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
                  <p className="text-sm text-destructive">{validationError}</p>
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
                  disabled={!Object.values(userInfo).every(value => value.trim() !== '')}
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