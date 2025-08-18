import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { CheckCircle, Mail } from 'lucide-react';


export function InviteCodeScreen() {
  const { state, dispatch } = useAppContext();
  const [inviteCode, setInviteCode] = useState('');
  const [showError, setShowError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inviteCode.trim()) {
      setShowError(true);
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });
    
    // Simulate invite code validation
    setTimeout(() => {
      // For demo purposes, accept any non-empty code
      if (inviteCode.trim().length > 0) {
        dispatch({ type: 'UPDATE_POSTCARD_DATA', payload: { inviteCode } });
        dispatch({ type: 'SET_STEP', payload: 2 });
        setShowError(false);
      } else {
        setShowError(true);
        setInviteCode('');
      }
      dispatch({ type: 'SET_LOADING', payload: false });
    }, 1000);
  };

  const handleInputChange = (value: string) => {
    setInviteCode(value);
    if (showError) {
      setShowError(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl display-title">
            Canary Cards
          </CardTitle>
          <CardDescription variant="subtitle" as="h3">
            Send handwritten postcards to your representatives
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                type="text"
                placeholder="Enter your invite code"
                value={inviteCode}
                onChange={(e) => handleInputChange(e.target.value)}
                className={showError ? 'border-destructive shake' : ''}
                autoComplete="off"
              />
              {showError && (
                <p className="text-sm text-destructive">
                  That invite code isn't valid. Try again.
                </p>
              )}
            </div>
            
            <Button 
              type="submit" 
              className="w-full h-12"
              disabled={state.isLoading}
            >
              {state.isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                  Validating...
                </>
              ) : (
                'Enter Invite Code'
              )}
            </Button>
          </form>
          
          <div className="mt-6 text-center text-sm text-muted-foreground">
            <p>This app is invite-only to ensure quality engagement</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}