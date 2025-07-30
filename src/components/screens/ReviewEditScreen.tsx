import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { ProgressIndicator } from '../ProgressIndicator';
import { ArrowLeft, Wand2, Edit3 } from 'lucide-react';

export function ReviewEditScreen() {
  const { state, dispatch } = useAppContext();
  const [editedMessage, setEditedMessage] = useState(state.postcardData.draftMessage || '');
  const [isRegenerating, setIsRegenerating] = useState(false);

  const charCount = editedMessage.length;
  const maxChars = 500;

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    
    // Mock AI regeneration
    setTimeout(() => {
      const originalMessage = state.postcardData.originalMessage || '';
      const rep = state.postcardData.representative;
      const userInfo = state.postcardData.userInfo;
      
      const regeneratedMessage = `Dear ${rep?.name || 'Representative'},

As your constituent from ${userInfo?.city}, ${userInfo?.state}, I wanted to share my concerns with you.

${originalMessage}

I believe these issues are important for our community and would appreciate your attention to them. Thank you for your service and for representing our interests.

Sincerely,
${userInfo?.firstName} ${userInfo?.lastName}`;
      
      setEditedMessage(regeneratedMessage);
      setIsRegenerating(false);
    }, 2000);
  };

  const handleContinue = () => {
    dispatch({ 
      type: 'UPDATE_POSTCARD_DATA', 
      payload: { finalMessage: editedMessage }
    });
    dispatch({ type: 'SET_STEP', payload: 5 });
  };

  const goBack = () => {
    dispatch({ type: 'SET_STEP', payload: 3 });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <ProgressIndicator currentStep={4} totalSteps={6} />
        
        <Card className="card-warm">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Review Your Postcard
              </h1>
              <p className="text-muted-foreground">
                Edit the message as needed, or regenerate a new version with AI
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Your Message</label>
                  <span className={`text-xs ${charCount > maxChars ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {charCount}/{maxChars}
                  </span>
                </div>
                <Textarea
                  value={editedMessage}
                  onChange={(e) => setEditedMessage(e.target.value)}
                  className="input-warm min-h-[200px] resize-none"
                  maxLength={maxChars}
                />
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleRegenerate}
                  disabled={isRegenerating}
                  className="button-warm flex-1"
                >
                  {isRegenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin mr-2" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4 mr-2" />
                      Regenerate with AI
                    </>
                  )}
                </Button>
              </div>

              <div className="flex gap-2 sm:gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={goBack}
                  className="button-warm h-12 px-3 sm:px-4 flex-shrink-0"
                >
                  <ArrowLeft className="w-4 h-4 mr-1 sm:mr-2" />
                  <span className="text-sm sm:text-base">Back</span>
                </Button>
                
                <Button
                  onClick={handleContinue}
                  disabled={!editedMessage.trim() || charCount > maxChars}
                  className="flex-1 button-warm h-12 text-sm sm:text-base min-w-0"
                >
                  <Edit3 className="w-4 h-4 mr-1 sm:mr-2 flex-shrink-0" />
                  <span className="truncate">Looks Good, Continue</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}