import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';

export default function Share() {
  const [searchParams] = useSearchParams();
  const [isNativeShareAvailable, setIsNativeShareAvailable] = useState(false);
  const { toast } = useToast();

  const ref = searchParams.get('ref') || 'direct';
  const orderNumber = searchParams.get('order') || '';

  // Check if user came from email or delivery
  const isFromEmail = ref === 'email' || ref === 'delivery';

  const shareContent = {
    title: 'Canary Cards - Real Postcards to Representatives',
    text: 'I just sent a real postcard with Canary Cards! Friends listen to friends. Show them how easy it is to send a real postcard.',
    url: 'https://canary.cards'
  };

  const handleNativeShare = async () => {
    console.log('Attempting native share with ref:', ref);
    if (navigator.share) {
      try {
        await navigator.share(shareContent);
        console.log('Shared successfully via native share');
        toast({
          title: "Thanks for sharing!",
          description: "Your friends can now easily contact their representatives too."
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
        if (error.name !== 'AbortError') {
          toast({
            title: "Share cancelled",
            description: "No worries! You can still copy the link below."
          });
        }
      }
    } else {
      console.log('Native share not available');
      toast({
        title: "Sharing not available",
        description: "Please copy the link below to share."
      });
    }
  };

  useEffect(() => {
    // Check if native sharing is available (mobile devices)
    const isNativeAvailable = 'share' in navigator;
    setIsNativeShareAvailable(isNativeAvailable);
    
    console.log('Share page loaded with ref:', ref, 'isNativeAvailable:', isNativeAvailable);
  }, []);

  const handleScreenTap = () => {
    if (isFromEmail && isNativeShareAvailable) {
      handleNativeShare();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Full-screen tap area for email users */}
      {isFromEmail && isNativeShareAvailable ? (
        <div 
          className="fixed inset-0 z-40 bg-background flex items-center justify-center cursor-pointer"
          onClick={handleScreenTap}
          style={{ top: '80px' }} // Account for header height
        >
          <div className="text-center p-8 max-w-md mx-auto">
            <div className="text-8xl mb-8">📮</div>
            <h1 className="text-4xl font-bold text-foreground mb-6">
              Ready to Share!
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Tap anywhere on this screen to share Canary Cards with your friends
            </p>
            <div className="animate-bounce text-2xl mb-4">👆</div>
            <div className="text-lg text-primary font-medium">
              Tap anywhere to share
            </div>
            <p className="text-sm text-muted-foreground mt-6">
              This will open your device's share menu with all your apps
            </p>
          </div>
        </div>
      ) : (
        // Regular share page content for non-email users
        <div className="container mx-auto px-4 py-8 max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-4">
              Share Canary Cards
            </h1>
            <p className="text-lg text-muted-foreground">
              Help others contact their representatives easily
            </p>
          </div>
          
          <div className="text-center">
            <button
              onClick={handleNativeShare}
              className="bg-primary text-primary-foreground px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary/90 transition-colors"
            >
              📱 Share with Friends
            </button>
          </div>
        </div>
      )}
    </div>
  );
}