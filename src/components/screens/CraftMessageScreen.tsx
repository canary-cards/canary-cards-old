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
  const [concerns, setConcerns] = useState('');
  const [personalImpact, setPersonalImpact] = useState('');
  const [additionalConcern, setAdditionalConcern] = useState('');
  const [showAdditionalConcern, setShowAdditionalConcern] = useState(false);
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
        // Parse the transcribed text into concerns and personal impact
        const transcribedText = data.text;
        if (inputMethod === 'voice') {
          // For voice input, put everything in concerns field initially
          setConcerns(transcribedText);
        }
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
    const combinedMessage = [concerns, personalImpact, additionalConcern].filter(Boolean).join('. ');
    
    if (!combinedMessage.trim()) {
      alert('Please enter your concerns first');
      return;
    }

    setIsDrafting(true);
    
    try {
      console.log('Starting message draft with:', {
        userInput: combinedMessage,
        repName: state.postcardData.representative?.name,
        userInfo: state.postcardData.userInfo
      });

      const { data, error } = await supabase.functions.invoke('draft-postcard-message', {
        body: {
          userInput: combinedMessage,
          repName: state.postcardData.representative?.name || 'Representative',
          userInfo: state.postcardData.userInfo || { fullName: '', streetAddress: '', city: '', state: '', zipCode: '' }
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
          originalMessage: combinedMessage,
          draftMessage: data.draftMessage 
        }
      });
      dispatch({ type: 'SET_STEP', payload: 3 });
      
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


  const handleSkipAI = () => {
    const combinedMessage = [concerns, personalImpact, additionalConcern].filter(Boolean).join('. ');
    dispatch({ 
      type: 'UPDATE_POSTCARD_DATA', 
      payload: { 
        originalMessage: combinedMessage,
        draftMessage: combinedMessage,
        finalMessage: combinedMessage
      }
    });
    dispatch({ type: 'SET_STEP', payload: 4 }); // Skip review, go to address
  };

  const goBack = () => {
    dispatch({ type: 'SET_STEP', payload: 1 });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-4 max-w-2xl">
        <ProgressIndicator currentStep={2} totalSteps={6} />
        
        <Card className="card-warm">
          <CardContent className="p-6">
            <div className="text-center mb-3">
              <h1 className="text-xl font-bold text-foreground mb-2">
                Make It Personal
              </h1>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 mb-3 max-w-lg mx-auto">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">i</span>
                  </div>
                  <p className="text-blue-800 dark:text-blue-200 text-xs leading-tight text-left">
                    Representatives are <strong>15x more likely</strong> to respond to postcards that include personal stories and local impact. Share how issues affect you directly.
                  </p>
                </div>
              </div>
            </div>

            {/* Input Method Toggle */}
            <div className="flex gap-2 mb-4 p-1 bg-muted rounded-xl">
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">I'm concerned about:</label>
                  <Textarea
                    placeholder="Healthcare costs, climate change, education funding..."
                    value={concerns}
                    onChange={(e) => setConcerns(e.target.value)}
                    className="input-warm min-h-[60px] resize-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">How it affects me or my community:</label>
                  <Textarea
                    placeholder="As a parent of two children in public schools..."
                    value={personalImpact}
                    onChange={(e) => setPersonalImpact(e.target.value)}
                    className="input-warm min-h-[70px] resize-none"
                  />
                </div>

                {showAdditionalConcern && (
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-foreground">Additional concern:</label>
                    <Textarea
                      placeholder="Another issue that matters to you..."
                      value={additionalConcern}
                      onChange={(e) => setAdditionalConcern(e.target.value)}
                      className="input-warm min-h-[60px] resize-none"
                    />
                  </div>
                )}

                {!showAdditionalConcern && (
                  <div className="-mt-3 -mb-2">
                    <button
                      type="button"
                      onClick={() => setShowAdditionalConcern(true)}
                      className="text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline flex items-center gap-1"
                    >
                      + Add one more concern (optional)
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-blue-800 dark:text-blue-200 font-medium mb-2 text-sm">When you record, share:</p>
                  <div className="space-y-1 text-blue-700 dark:text-blue-300">
                    <p className="text-xs">1. What specific issue concerns you most</p>
                    <p className="text-xs">2. How it personally affects you or your community</p>
                  </div>
                </div>

                <div className="text-center space-y-3">
                  <Button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`w-20 h-20 rounded-full button-warm ${
                      isRecording ? 'bg-destructive hover:bg-destructive/90 recording-pulse' : 'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {isRecording ? (
                      <MicOff className="w-6 h-6" />
                    ) : (
                      <Mic className="w-6 h-6" />
                    )}
                  </Button>
                  
                  <div className="space-y-1">
                    {isRecording ? (
                      <>
                        <p className="text-xs font-medium text-destructive">
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
                        <p className="text-xs font-medium">
                          Tap to start recording
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

                {concerns && !isTranscribing && (
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <p className="text-sm text-muted-foreground mb-2">Transcribed:</p>
                    <p className="text-sm">{concerns}</p>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2 pt-4">
              <Button
                onClick={handleDraftMessage}
                disabled={(!concerns.trim() && !personalImpact.trim()) || isDrafting}
                className="w-full button-warm h-10"
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

              <Button
                variant="outline"
                onClick={handleSkipAI}
                disabled={!concerns.trim() && !personalImpact.trim()}
                className="w-full button-warm h-10"
              >
                Skip AI & Write Myself
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={goBack}
                className="w-full button-warm h-10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}