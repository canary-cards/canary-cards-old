import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAppContext } from '../../context/AppContext';
import { ProgressIndicator } from '../ProgressIndicator';
import { ArrowLeft, Wand2, ChevronDown, Edit3 } from 'lucide-react';

export function ReviewEditScreen() {
  const { state, dispatch } = useAppContext();
  const [editedMessage, setEditedMessage] = useState(state.postcardData.draftMessage || '');
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [tone, setTone] = useState('professional');
  const [length, setLength] = useState('medium');

  const charCount = editedMessage.length;
  const maxChars = 500;

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    
    // Mock AI regeneration
    setTimeout(() => {
      const variations = [
        state.postcardData.draftMessage,
        generateVariation(state.postcardData.originalMessage || '', 'casual'),
        generateVariation(state.postcardData.originalMessage || '', 'formal'),
        generateVariation(state.postcardData.originalMessage || '', 'urgent')
      ];
      
      const randomVariation = variations[Math.floor(Math.random() * variations.length)];
      setEditedMessage(randomVariation || '');
      setIsRegenerating(false);
    }, 2000);
  };

  const generateVariation = (originalMessage: string, style: string): string => {
    const rep = state.postcardData.representative;
    const userInfo = state.postcardData.userInfo;
    
    const intros = {
      casual: `Hi ${rep?.name || 'Representative'},`,
      formal: `Dear Honorable ${rep?.name || 'Representative'},`,
      urgent: `Dear ${rep?.name || 'Representative'}, I urgently need your attention on`,
    };

    const outros = {
      casual: `Thanks for listening!\n${userInfo?.firstName} ${userInfo?.lastName}`,
      formal: `I respectfully request your consideration of these matters.\n\nSincerely,\n${userInfo?.firstName} ${userInfo?.lastName}`,
      urgent: `Please act quickly on these pressing issues.\n\nUrgently yours,\n${userInfo?.firstName} ${userInfo?.lastName}`,
    };

    return `${intros[style as keyof typeof intros]}

As a constituent from ${userInfo?.city}, ${userInfo?.state}, ${originalMessage}

${outros[style as keyof typeof outros]}`;
  };

  const handleContinue = () => {
    dispatch({ 
      type: 'UPDATE_POSTCARD_DATA', 
      payload: { finalMessage: editedMessage }
    });
    dispatch({ type: 'SET_STEP', payload: 6 });
  };

  const goBack = () => {
    dispatch({ type: 'SET_STEP', payload: 4 });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <ProgressIndicator currentStep={4} totalSteps={5} />
        
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

              {/* Advanced Editing Options */}
              <Collapsible open={showAdvanced} onOpenChange={setShowAdvanced}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" className="w-full justify-between p-0 h-auto">
                    <span className="text-sm text-primary">Advanced editing options</span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4 pt-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Tone</label>
                      <select 
                        value={tone}
                        onChange={(e) => setTone(e.target.value)}
                        className="w-full p-2 rounded-lg border border-border bg-background"
                      >
                        <option value="professional">Professional</option>
                        <option value="casual">Casual</option>
                        <option value="formal">Formal</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Length</label>
                      <select 
                        value={length}
                        onChange={(e) => setLength(e.target.value)}
                        className="w-full p-2 rounded-lg border border-border bg-background"
                      >
                        <option value="short">Short</option>
                        <option value="medium">Medium</option>
                        <option value="long">Detailed</option>
                      </select>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

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
                  onClick={handleContinue}
                  disabled={!editedMessage.trim() || charCount > maxChars}
                  className="flex-1 button-warm h-12"
                >
                  <Edit3 className="w-4 h-4 mr-2" />
                  Looks Good, Continue
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}