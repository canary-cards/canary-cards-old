import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useAppContext } from '../../context/AppContext';
import { ProgressIndicator } from '../ProgressIndicator';
import { Mic, MicOff, ArrowLeft, Wand2, Type } from 'lucide-react';

export function CraftMessageScreen() {
  const { state, dispatch } = useAppContext();
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [inputMethod, setInputMethod] = useState<'text' | 'voice'>('text');
  const [recordingTime, setRecordingTime] = useState(0);
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
    // Mock transcription for demo - in real app would use OpenAI Whisper API
    setTimeout(() => {
      const mockTranscriptions = [
        "I'm concerned about climate change and want to see more investment in renewable energy in our district.",
        "Healthcare costs are rising and I hope you'll support legislation to make healthcare more affordable.",
        "Public transportation in our area needs improvement, especially for seniors and disabled residents.",
        "I'm worried about education funding cuts and hope you'll prioritize our local schools."
      ];
      
      const randomTranscription = mockTranscriptions[Math.floor(Math.random() * mockTranscriptions.length)];
      setMessage(randomTranscription);
    }, 1500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleDraftMessage = async () => {
    if (!message.trim()) {
      alert('Please enter your concerns first');
      return;
    }

    setIsDrafting(true);
    
    // Mock AI drafting - in real app would use OpenAI/Claude API
    setTimeout(() => {
      const draftMessage = generateDraftMessage(message);
      dispatch({ 
        type: 'UPDATE_POSTCARD_DATA', 
        payload: { 
          originalMessage: message,
          draftMessage 
        }
      });
      dispatch({ type: 'SET_STEP', payload: 5 });
      setIsDrafting(false);
    }, 3000);
  };

  const generateDraftMessage = (input: string): string => {
    // Mock AI generation
    const rep = state.postcardData.representative;
    const userInfo = state.postcardData.userInfo;
    
    return `Dear ${rep?.name || 'Representative'},

As your constituent from ${userInfo?.city}, ${userInfo?.state}, I wanted to share my concerns with you.

${input}

I believe these issues are important for our community and would appreciate your attention to them. Thank you for your service and for representing our interests.

Sincerely,
${userInfo?.firstName} ${userInfo?.lastName}`;
  };

  const goBack = () => {
    dispatch({ type: 'SET_STEP', payload: 3 });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <ProgressIndicator currentStep={3} totalSteps={5} />
        
        <Card className="card-warm">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold text-foreground mb-2">
                What's on Your Mind?
              </h1>
              <p className="text-muted-foreground">
                You don't need to write the whole message. Just list your main concerns, and AI will take it from there. 
                You'll have a chance to edit afterwards. The most important thing is to make it personal and relevant to you.
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

                {message && (
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