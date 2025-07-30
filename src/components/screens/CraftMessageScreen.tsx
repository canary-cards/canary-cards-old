import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { ProgressIndicator } from '../ProgressIndicator';
import { Mic, MicOff, ArrowLeft, Wand2, Type } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function CraftMessageScreen() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [inputMethod, setInputMethod] = useState<'text' | 'voice'>('text');
  const [recordingTime, setRecordingTime] = useState(0);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await transcribeAudio(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Unable to access microphone. Please check permissions and try typing instead.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
    }
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setIsRecording(false);
    setRecordingTime(0);
  };

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true);
    
    try {
      // Convert audio blob to base64
      const arrayBuffer = await audioBlob.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      let binary = '';
      const chunkSize = 0x8000;
      
      for (let i = 0; i < bytes.length; i += chunkSize) {
        const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      
      const base64Audio = btoa(binary);

      // Call Supabase edge function
      const { data, error } = await supabase.functions.invoke('transcribe-audio', {
        body: { audio: base64Audio }
      });

      if (error) {
        throw error;
      }

      if (data?.text) {
        setMessage(data.text);
        toast({
          title: "Transcription complete",
          description: "Your voice has been transcribed successfully.",
        });
      } else {
        throw new Error('No transcription received');
      }

    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        title: "Transcription failed",
        description: "Please try recording again or use the text input instead.",
        variant: "destructive",
      });
    } finally {
      setIsTranscribing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const convertListToSentence = (input: string): string => {
    // Check if input looks like a list (comma-separated, bullet points, or line breaks)
    const isListLike = input.includes(',') || input.includes('•') || input.includes('-') || 
                       input.includes('\n') || input.match(/^\d+\./) || input.includes(';');
    
    if (!isListLike) {
      return input; // Return as-is if it's already a sentence
    }
    
    // Clean up the input and convert to sentence format
    let cleanedInput = input
      .replace(/[•\-*]/g, '') // Remove bullet points
      .replace(/^\d+\.\s*/gm, '') // Remove numbered list markers
      .replace(/\n+/g, ', ') // Replace line breaks with commas
      .replace(/[,;]+/g, ', ') // Normalize multiple commas/semicolons
      .replace(/,\s*,/g, ',') // Remove duplicate commas
      .trim();
    
    // Remove trailing comma if present
    cleanedInput = cleanedInput.replace(/,\s*$/, '');
    
    // If it doesn't end with punctuation, add a period
    if (!cleanedInput.match(/[.!?]$/)) {
      cleanedInput += '.';
    }
    
    return cleanedInput;
  };

  const handleDraftMessage = async () => {
    if (!message.trim()) {
      alert('Please enter your concerns first');
      return;
    }

    setIsDrafting(true);
    
    try {
      console.log('Starting message draft with:', {
        userInput: message,
        repName: state.postcardData.representative?.name,
        userInfo: state.postcardData.userInfo
      });

      const { data, error } = await supabase.functions.invoke('draft-postcard-message', {
        body: {
          userInput: message,
          repName: state.postcardData.representative?.name || 'Representative',
          userInfo: state.postcardData.userInfo
        }
      });

      console.log('Supabase function response:', { data, error });

      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }

      if (!data?.draftMessage) {
        console.error('No draft message in response:', data);
        throw new Error('No draft message received from AI');
      }

      dispatch({ 
        type: 'UPDATE_POSTCARD_DATA', 
        payload: { 
          originalMessage: message,
          draftMessage: data.draftMessage 
        }
      });
      dispatch({ type: 'SET_STEP', payload: 4 });
      
      toast({
        title: "Message drafted!",
        description: "Your personalized postcard message has been created.",
      });
    } catch (error) {
      console.error('Error drafting message:', error);
      toast({
        title: "Drafting failed",
        description: `Error: ${error.message || 'Please try again or contact support if the issue persists.'}`,
        variant: "destructive",
      });
    } finally {
      setIsDrafting(false);
    }
  };


  const goBack = () => {
    dispatch({ type: 'SET_STEP', payload: 2 });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <ProgressIndicator currentStep={3} totalSteps={6} />
        
        <Card className="card-warm">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                What's on Your Mind?
              </h1>
              <p className="text-muted-foreground">
                Make this personal and relevant to you! You don't need to write the whole message. Just list your main concerns, and AI will take it from there. You'll have a chance to edit afterwards.
              </p>
            </div>

            {/* Input Method Toggle */}
            <div className="flex gap-2 mb-6 p-1 bg-muted rounded-xl">
              <Button
                type="button"
                variant={inputMethod === 'text' ? 'default' : 'ghost'}
                className="flex-1 rounded-lg"
                onClick={() => setInputMethod('text')}
              >
                <Type className="w-4 h-4 mr-2" />
                Type
              </Button>
              <Button
                type="button"
                variant={inputMethod === 'voice' ? 'default' : 'ghost'}
                className="flex-1 rounded-lg"
                onClick={() => setInputMethod('voice')}
              >
                <Mic className="w-4 h-4 mr-2" />
                Voice
              </Button>
            </div>

            {inputMethod === 'text' ? (
              <div className="space-y-4">
                <Textarea
                  placeholder="Tell us what's important to you... (e.g., healthcare costs, climate change, education funding, transportation)"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="input-warm min-h-[150px] resize-none"
                />
                <p className="text-sm text-muted-foreground text-right">
                  {message.length} characters
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <Button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-24 h-24 rounded-full button-warm ${
                      isRecording ? 'bg-destructive hover:bg-destructive/90 recording-pulse' : ''
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-8 h-8" />
                    ) : (
                      <Mic className="w-8 h-8" />
                    )}
                  </Button>
                  
                  <div className="space-y-2">
                    {isRecording ? (
                      <>
                        <p className="text-sm font-medium text-destructive">
                          Recording... {formatTime(recordingTime)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Tap again to stop
                        </p>
                        <div className="flex justify-center">
                          <div className="flex space-x-1">
                            {[...Array(3)].map((_, i) => (
                              <div
                                key={i}
                                className="w-1 h-4 bg-destructive rounded-full animate-pulse"
                                style={{ animationDelay: `${i * 0.2}s` }}
                              />
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <p className="text-sm font-medium">
                          Tap to start recording
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Speak clearly about your concerns
                        </p>
                      </>
                    )}
                  </div>
                </div>

                {isTranscribing && (
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm text-muted-foreground">Transcribing your voice...</p>
                    </div>
                  </div>
                )}

                {message && !isTranscribing && (
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-2">Transcribed:</p>
                    <p className="text-sm">{message}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-4 pt-6">
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
                onClick={handleDraftMessage}
                disabled={!message.trim() || isDrafting}
                className="flex-1 button-warm h-12"
              >
                {isDrafting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    AI is thinking...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4 mr-2" />
                    Draft My Postcard
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}