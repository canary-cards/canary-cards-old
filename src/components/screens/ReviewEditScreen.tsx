import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { ArrowLeft, Wand2, Edit3 } from 'lucide-react';
export function ReviewEditScreen() {
  const {
    state,
    dispatch
  } = useAppContext();
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
${userInfo?.fullName}`;
      setEditedMessage(regeneratedMessage);
      setIsRegenerating(false);
    }, 2000);
  };
  const handleContinue = () => {
    dispatch({
      type: 'UPDATE_POSTCARD_DATA',
      payload: {
        finalMessage: editedMessage
      }
    });
    dispatch({
      type: 'SET_STEP',
      payload: 4
    });
  };
  const goBack = () => {
    dispatch({
      type: 'SET_STEP',
      payload: 2
    });
  };
  return <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="card-warm">
          <CardContent className="p-8">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Review Your Postcard
              </h1>
              <p className="text-muted-foreground">Finalize the message you want to send to your locally elected official</p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Your Message</label>
                  <span className={`text-xs ${charCount > maxChars ? 'text-destructive' : 'text-muted-foreground'}`}>
                    {charCount}/{maxChars}
                  </span>
                </div>
                <div className="relative">
                  <Textarea value={editedMessage} onChange={e => setEditedMessage(e.target.value)} className="input-warm min-h-[300px] resize-none pr-12" maxLength={maxChars} />
                  <Edit3 className="w-8 h-8 text-muted-foreground absolute bottom-3 right-3 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Button onClick={handleContinue} disabled={!editedMessage.trim() || charCount > maxChars} className="w-full button-warm h-12 text-base">
                  <span>Looks Good, Continue</span>
                </Button>
                
                <Button type="button" variant="outline" onClick={goBack} className="w-full button-warm h-12 text-base">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  <span>Back</span>
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>;
}