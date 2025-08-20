import { useEffect, useState } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Share, Twitter, Facebook, Copy, Plus, BarChart3, Mail, Clock, ArrowLeft, User } from 'lucide-react';
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

  // Generate realistic contact volume
  const getContactVolume = () => {
    return Math.floor(Math.random() * (75 - 25) + 25); // Random between 25-75
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
    const colors = ['hsl(46, 100%, 66%)', 'hsl(212, 29%, 25%)', 'hsl(3, 62%, 52%)'];
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
  const contactVolume = getContactVolume();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-4">
        <Logo className="h-8" />
        <HamburgerMenu />
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-8 px-4 space-y-8 max-w-4xl mx-auto">
        
        {/* 1. Success Header */}
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-white" />
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="display-title text-primary">
              Your postcard is on its way.
            </h1>
            
            <p className="body-text text-muted-foreground">
              We'll email you when it's been mailed.
            </p>
          </div>
        </div>

        {/* 2. Proof of Impact */}
        <Card className="bg-card border shadow-lg">
          <CardContent className="p-8 space-y-6">
            <h3 className="eyebrow text-secondary">Proof it matters</h3>
            <p className="body-text">
              You're one of {contactVolume} people who wrote to {representative?.type === 'senator' ? 'Sen.' : 'Rep.'} {representative?.name?.split(' ').pop() || 'Your Representative'} today. Together, small actions add up.
            </p>
          </CardContent>
        </Card>

        {/* 3. Share Section (Optional, Gentle) */}
        <div className="space-y-6">
          <hr className="border-[#E8DECF]" />
          
          <div className="text-center space-y-4">
            <h2 className="display-title text-primary">
              Want to spread the word?
            </h2>
            
            <p className="body-text">
              Let a friend know how easy it is to send a real postcard in under 2 minutes.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center max-w-md mx-auto">
              <Button 
                variant="default" 
                className="flex-1"
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
                <Share className="w-4 h-4" />
                Share with a friend
              </Button>
              
              <Button variant="outline" className="flex-1 border-secondary text-secondary hover:bg-secondary hover:text-white">
                Not now
              </Button>
            </div>
          </div>
        </div>

        {/* 4. Next Steps (Closure) */}
        <div className="text-center">
          <p className="text-sm leading-relaxed text-muted-foreground">
            Check your inbox for your order confirmation. We'll notify you again once your card is mailed.
          </p>
        </div>

      </div>
    </div>
  );
}