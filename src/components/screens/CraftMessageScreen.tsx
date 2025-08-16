import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { ProgressIndicator } from '../ProgressIndicator';
import { Mic, Square, ArrowLeft, Wand2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export function CraftMessageScreen() {
  const { state, dispatch } = useAppContext();
  const { toast } = useToast();
  const [concerns, setConcerns] = useState('');
  const [personalImpact, setPersonalImpact] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [recordingField, setRecordingField] = useState<'concerns' | 'impact' | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [transcribingField, setTranscribingField] = useState<'concerns' | 'impact' | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const startRecording = async (field: 'concerns' | 'impact') => {
    try {
      if (isRecording) {
        // Stop any ongoing recording before starting a new one
        stopRecording();
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      setRecordingField(field);
      
      const audioChunks: Blob[] = [];
      
      mediaRecorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
      };
      
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
        await transcribeAudio(audioBlob, field);
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
      toast({
        title: 'Microphone access denied',
        description: 'Please allow microphone permissions and try again.',
        variant: 'destructive',
      });
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
    setRecordingField(null);
  };

  const transcribeAudio = async (audioBlob: Blob, field: 'concerns' | 'impact') => {
    setTranscribingField(field);
    
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
        const transcribedText = data.text.trim();
        if (field === 'concerns') {
          setConcerns(prev => (prev ? `${prev.trim()} ${transcribedText}` : transcribedText));
        } else {
          setPersonalImpact(prev => (prev ? `${prev.trim()} ${transcribedText}` : transcribedText));
        }
        toast({
          title: "Transcription complete",
          description: "Your voice has been transcribed and added to the field.",
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
      setTranscribingField(null);
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
    const combinedMessage = [concerns, personalImpact].filter(Boolean).join('. ');
    
    if (!combinedMessage.trim()) {
      alert('Please enter your concerns first');
      return;
    }

    setIsDrafting(true);
    
    try {
      console.log('Starting message draft with:', {
        concerns,
        personalImpact,
        representative: state.postcardData.representative
      });

      const { data, error } = await supabase.functions.invoke('draft-postcard-message', {
        body: {
          concerns: concerns.trim(),
          personalImpact: personalImpact.trim(),
          representative: state.postcardData.representative,
          zipCode: state.postcardData.zipCode
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
    const combinedMessage = [concerns, personalImpact].filter(Boolean).join('. ');
    dispatch({ 
      type: 'UPDATE_POSTCARD_DATA', 
      payload: { 
        originalMessage: combinedMessage,
        draftMessage: combinedMessage,
        finalMessage: combinedMessage
      }
    });
    dispatch({ type: 'SET_STEP', payload: 3 }); // Go to review screen
  };

  const goBack = () => {
    dispatch({ type: 'SET_STEP', payload: 1 });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 pt-20 pb-4 max-w-2xl">
        <Card className="card-warm">
          <CardContent className="p-6">
            <div className="text-center mb-3">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Make It Personal
              </h1>
              
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800 mb-3 max-w-lg mx-auto">
                <div className="flex items-start gap-2">
                  <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">i</span>
                  </div>
                  <p className="text-blue-800 dark:text-blue-200 text-xs leading-tight text-left">
                    Messages with personal stories and local impact are <strong>20x more effective</strong> at achieving significant influence compared to form letters.
                  </p>
                </div>
              </div>
            </div>

            {/* Simplified inputs with inline microphone controls */}
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">I'm most concerned about:</label>
                <div className="relative">
                  <Textarea
                    placeholder="Healthcare costs, climate change, education funding..."
                    value={concerns}
                    onChange={(e) => setConcerns(e.target.value)}
                    className="input-warm min-h-[60px] resize-none pr-16"
                  />
                  <button
                    type="button"
                    aria-label={isRecording && recordingField === 'concerns' ? 'Stop recording' : 'Start recording for concerns'}
                    aria-pressed={isRecording && recordingField === 'concerns'}
                    onClick={() => (isRecording && recordingField === 'concerns') ? stopRecording() : startRecording('concerns')}
                    className={`absolute right-3 top-3 z-10 inline-flex items-center justify-center h-8 w-8 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-sm bg-background border border-border ${
                      isRecording && recordingField === 'concerns'
                        ? 'bg-destructive text-destructive-foreground ring-2 ring-destructive/40 shadow-lg animate-pulse'
                        : 'bg-background text-primary hover:bg-primary/10'
                    }`}
                  >
                    {isRecording && recordingField === 'concerns' && (
                      <span className="absolute inset-0 rounded-full bg-destructive/40 animate-ping sm:hidden" aria-hidden="true" />
                    )}
                    {isRecording && recordingField === 'concerns' ? (
                      <Square className="w-5 h-5" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {isRecording && recordingField === 'concerns' && (
                  <div className="flex justify-end">
                    <span aria-live="polite" className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                )}
                {transcribingField === 'concerns' && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Transcribing your voice...
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">How it affects me or my community:</label>
                <div className="relative">
                  <Textarea
                    placeholder="As a parent of two children in public schools..."
                    value={personalImpact}
                    onChange={(e) => setPersonalImpact(e.target.value)}
                    className="input-warm min-h-[70px] resize-none pr-16"
                  />
                  <button
                    type="button"
                    aria-label={isRecording && recordingField === 'impact' ? 'Stop recording' : 'Start recording for impact'}
                    aria-pressed={isRecording && recordingField === 'impact'}
                    onClick={() => (isRecording && recordingField === 'impact') ? stopRecording() : startRecording('impact')}
                    className={`absolute right-3 top-3 z-10 inline-flex items-center justify-center h-8 w-8 rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring shadow-sm bg-background border border-border ${
                      isRecording && recordingField === 'impact'
                        ? 'bg-destructive text-destructive-foreground ring-2 ring-destructive/40 shadow-lg animate-pulse'
                        : 'bg-background text-primary hover:bg-primary/10'
                    }`}
                  >
                    {isRecording && recordingField === 'impact' && (
                      <span className="absolute inset-0 rounded-full bg-destructive/40 animate-ping sm:hidden" aria-hidden="true" />
                    )}
                    {isRecording && recordingField === 'impact' ? (
                      <Square className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>
                </div>
                {isRecording && recordingField === 'impact' && (
                  <div className="flex justify-end">
                    <span aria-live="polite" className="mt-1 inline-flex items-center gap-1 text-xs text-muted-foreground bg-muted/50 rounded px-2 py-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse" />
                      {formatTime(recordingTime)}
                    </span>
                  </div>
                )}
                {transcribingField === 'impact' && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <span className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    Transcribing your voice...
                  </p>
                )}
              </div>
            </div>

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