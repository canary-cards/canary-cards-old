import { useEffect, useState } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Share } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HamburgerMenu } from '@/components/HamburgerMenu';
import { Logo } from '@/components/Logo';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [shareableLink, setShareableLink] = useState('');
  const { toast } = useToast();

  // Get representative data from localStorage
  const getRepresentativeData = () => {
    try {
      const storedData = localStorage.getItem('postcardData');
      if (storedData) {
        const data = JSON.parse(storedData);
        return data.representative || null;
      }
    } catch (error) {
      console.error('Error getting representative data:', error);
    }
    return null;
  };

  // Get app URL for sharing
  const getAppUrl = () => {
    if (window.location.origin.includes('lovable.app') && window.location.pathname.includes('/edit/')) {
      return null;
    }
    return window.location.origin;
  };

  // Calculate delivery date (3-5 business days)
  const getDeliveryDate = () => {
    const today = new Date();
    let businessDays = 0;
    let currentDate = new Date(today);

    while (businessDays < 4) { // 4 business days average
      currentDate.setDate(currentDate.getDate() + 1);
      const dayOfWeek = currentDate.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Not weekend
        businessDays++;
      }
    }

    return currentDate.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  // Fallback messages for proof of impact
  const getProofMessage = () => {
    const messages = [
      "Handwritten postcards reach Congressional offices faster than letters or emails. Every card makes your voice harder to ignore.",
      "Postcards reach Congressional offices faster than letters—no security delays, no spam filters.",
      "Real ink and paper get noticed. Handwritten postcards stand out when emails and petitions don't.",
      "Every card adds to a growing chorus of voices your representative can't ignore."
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  };

  useEffect(() => {
    // Show confetti animation
    showConfetti();
    
    // Generate shareable link
    const appUrl = getAppUrl();
    if (appUrl) {
      setShareableLink(appUrl);
    }
  }, []);

  const showConfetti = () => {
    const colors = ['hsl(46, 100%, 66%)', 'hsl(212, 29%, 25%)', 'hsl(120, 50%, 60%)'];
    for (let i = 0; i < 50; i++) {
      createConfettiPiece(colors[Math.floor(Math.random() * colors.length)]);
    }
  };

  const createConfettiPiece = (color: string) => {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: fixed;
      width: 8px;
      height: 8px;
      background: ${color};
      left: ${Math.random() * 100}vw;
      top: -10px;
      z-index: 1000;
      border-radius: 50%;
      animation: confetti-fall ${Math.random() * 2 + 1.2}s linear forwards;
    `;
    document.body.appendChild(confetti);

    if (!document.querySelector('#confetti-style')) {
      const style = document.createElement('style');
      style.id = 'confetti-style';
      style.textContent = `
        @keyframes confetti-fall {
          to {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    setTimeout(() => confetti.remove(), 3000);
  };

  const copyShareableLink = async () => {
    if (shareableLink) {
      try {
        await navigator.clipboard.writeText(shareableLink);
        toast({
          title: "Link copied!",
          description: "Share this link with friends and family."
        });
      } catch (err) {
        toast({
          title: "Failed to copy",
          description: "Please copy the link manually.",
          variant: "destructive"
        });
      }
    }
  };

  const shareViaTwitter = () => {
    const text = "I just sent a real, handwritten postcard to my representative. It takes 2 minutes and actually gets read.";
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareableLink)}`;
    window.open(url, '_blank');
  };

  const shareViaFacebook = () => {
    const text = "Did you know handwritten postcards to Congress get read first, while emails often go to spam? I just sent mine in under 2 minutes.";
    const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareableLink)}&quote=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const representative = getRepresentativeData();
  const deliveryDate = getDeliveryDate();
  const proofMessage = getProofMessage();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-4">
        <Logo className="h-8" />
        <HamburgerMenu />
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 pt-10 space-y-8">
        
        {/* 1. Success Header */}
        <div className="text-center mt-8">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-12 h-12 text-accent shadow-[0_0_0_2px_hsl(var(--primary))]" />
          </div>
          
          <h1 className="font-display text-3xl font-bold text-primary mb-8">
            Your postcard is on its way.
          </h1>
          
          <p className="body-text text-muted-foreground mb-8">
            We'll email you when it's been mailed.
          </p>
        </div>

        {/* 2. Proof of Impact */}
        <Card className="shadow-sm mb-10">
          <CardContent className="p-10">
            <h3 className="eyebrow text-primary mb-3">Proof it matters</h3>
            <p className="body-text max-w-72 mx-auto leading-relaxed">
              {proofMessage}
            </p>
          </CardContent>
        </Card>

        {/* 3. Share Section */}
        <div className="space-y-8">
          <div className="border-t border-border my-10"></div>
          
          <div className="text-center space-y-6">
            <h2 className="font-display text-2xl font-semibold text-primary mb-4">
              Want to spread the word?
            </h2>
            
            <p className="body-text mb-6">
              Let a friend know how easy it is to send a real postcard in under 2 minutes.
            </p>
            
            <div className="space-y-5">
              <Button 
                variant="primary" 
                size="lg"
                className="w-full h-14 px-6"
                onClick={() => {
                  if (navigator.share) {
                    navigator.share({
                      title: 'Contact Your Representatives with Canary Cards',
                      text: 'Make your voice heard by sending postcards to your representatives!',
                      url: shareableLink
                    });
                  } else {
                    copyShareableLink();
                  }
                }}
              >
                <Share className="w-5 h-5 mr-3" />
                Share with a friend
              </Button>
              
              <Button variant="outline" size="lg" className="w-full h-14 px-6 border-border/60">
                Home
              </Button>
            </div>
          </div>
        </div>

        {/* 4. Next Steps (Closure) */}
        <div className="text-left pt-8 pb-6">
          <p className="text-xs leading-relaxed text-muted-foreground/60 font-normal">
            Check your inbox for your order confirmation. We'll notify you again once your card is mailed.
          </p>
        </div>

      </div>
    </div>
  );
}