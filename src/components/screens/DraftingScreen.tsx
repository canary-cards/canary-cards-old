import React, { useEffect, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../integrations/supabase/client';
import { Loader2 } from 'lucide-react';

const draftingMessages = [
  "Analyzing your concerns…",
  "Matching with bills in Congress…",
  "Highlighting local impact…",
  "Weaving in your story...",
  "Optimizing for influence…",
  "Fitting onto a postcard…",
  "Completing draft — amplifying your voice..."
];

export function DraftingScreen() {
  const { state, dispatch } = useAppContext();
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [startTime] = useState(Date.now());

  // Rotate messages every 1.5 seconds, but stop at the last message
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMessageIndex((prev) => {
        if (prev < draftingMessages.length - 1) {
          return prev + 1;
        }
        return prev; // Stay on last message
      });
    }, 1750);

    return () => clearInterval(interval);
  }, []);

  // Handle the actual drafting process
  useEffect(() => {
    const draftMessage = async () => {
      try {
        const { concerns, personalImpact } = state.postcardData;
        
        if (!concerns || !personalImpact) {
          dispatch({ type: 'SET_ERROR', payload: 'Missing required information' });
          return;
        }

        // Call the edge function to draft the message
        const { data, error } = await supabase.functions.invoke('draft-postcard-message', {
          body: {
            concerns,
            personalImpact,
            representative: state.postcardData.representative,
            zipCode: state.postcardData.zipCode
          }
        });

        if (error) {
          console.error('Error drafting message:', error);
          dispatch({ type: 'SET_ERROR', payload: 'Failed to draft message' });
          return;
        }

        if (!data?.draftMessage) {
          console.error('No draft message in response:', data);
          dispatch({ type: 'SET_ERROR', payload: 'No draft message received from AI' });
          return;
        }

        // Ensure minimum 1 second dwell time
        const elapsedTime = Date.now() - startTime;
        const remainingTime = Math.max(0, 1000 - elapsedTime);

        setTimeout(() => {
          // Update the postcard data with the drafted message
          dispatch({
            type: 'UPDATE_POSTCARD_DATA',
            payload: {
              originalMessage: `${concerns}\n\n${personalImpact}`,
              draftMessage: data.draftMessage,
              sources: data.sources || []
            }
          });

          // Navigate to review screen (step 3)
          dispatch({ type: 'SET_STEP', payload: 3 });
        }, remainingTime);

      } catch (error) {
        console.error('Error in drafting process:', error);
        dispatch({ type: 'SET_ERROR', payload: 'An error occurred while drafting your message' });
      }
    };

    draftMessage();

    // Set timeout for 45 seconds
    const timeout = setTimeout(() => {
      // If still on this screen after 45 seconds, navigate to review
      dispatch({ type: 'SET_STEP', payload: 3 });
    }, 45000);

    return () => clearTimeout(timeout);
  }, [state.postcardData, dispatch, startTime]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-8 max-w-md mx-auto">
        <div className="flex items-center justify-center space-x-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">
            Drafting your postcard
          </h1>
        </div>
        
        <p className="text-lg text-muted-foreground">
          {draftingMessages[currentMessageIndex]}
        </p>
      </div>
    </div>
  );
}