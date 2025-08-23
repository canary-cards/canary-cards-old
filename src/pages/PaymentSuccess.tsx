import { useEffect, useState } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Share, Mail } from 'lucide-react';
import { BreakthroughCheckmark } from '@/components/ui/breakthrough-checkmark';
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

  // Get order data from search params or localStorage
  const getOrderData = () => {
    const sessionId = searchParams.get('session_id');
    const orderNumber = sessionId ? sessionId.slice(-8).toUpperCase() : 'CC' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    try {
      const storedData = localStorage.getItem('postcardData');
      if (storedData) {
        const data = JSON.parse(storedData);
        const recipients = [];
        
        // Get actual recipients based on send option
        if (data.sendOption === 'single' && data.representative) {
          recipients.push(data.representative.name);
        } else if (data.sendOption === 'double' && data.representative && data.senators?.[0]) {
          recipients.push(data.representative.name, data.senators[0].name);
        } else if (data.sendOption === 'triple' && data.representative && data.senators?.length >= 2) {
          recipients.push(data.representative.name, data.senators[0].name, data.senators[1].name);
        }
        
        return {
          orderNumber,
          recipients: recipients.length > 0 ? recipients : ['Your Representative']
        };
      }
    } catch (error) {
      console.error('Error getting order data:', error);
    }
    
    return {
      orderNumber,
      recipients: ['Your Representative']
    };
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
  const orderData = getOrderData();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-4">
        <Logo className="h-8" />
        <HamburgerMenu />
      </div>

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 pt-20 space-y-6">
        
        {/* 1. Success Card */}
        <Card className="shadow-sm">
          <CardContent className="p-5 text-center">
            <div className="flex justify-center mb-4">
              <BreakthroughCheckmark size={48} />
            </div>
            
            <h1 className="display-title text-primary mb-2">
              Payment Successful
            </h1>
            
            <h2 className="subtitle mb-4">
              Your postcards are being prepared
            </h2>
            
            <p className="body-text">
              We'll email you as soon as your card is mailed. Your effort lands directly on their desk — not their spam folder.
            </p>
          </CardContent>
        </Card>

        {/* 2. Order Summary Card */}
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <h3 className="subtitle mb-4">Order details</h3>
            
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="field-label">Order #{orderData.orderNumber}</span>
                <div className="flex items-center gap-2 px-3 py-1 bg-accent text-accent-foreground text-sm rounded-md">
                  <CheckCircle className="w-3 h-3" />
                  Confirmed
                </div>
              </div>
              
              <div className="border-t border-border pt-3">
                <p className="field-label mb-1">Recipients</p>
                <p className="body-text">{orderData.recipients.join(', ')}</p>
              </div>
              
              <div className="border-t border-border pt-3">
                <p className="field-label mb-1">Next Step</p>
                <p className="body-text">Delivery by {deliveryDate}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. Proof of Impact Card */}
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Mail className="w-4 h-4 text-primary" />
              <h3 className="subtitle">Proof of Impact</h3>
            </div>
            
            <p className="body-text mb-4">
              Handwritten postcards reach Congressional offices faster than letters or emails. Verified constituent mail is prioritized by staff.
            </p>
            
            <p className="body-text text-muted-foreground">
              You're one of many voices reaching your representatives today — and that volume matters.
            </p>
          </CardContent>
        </Card>

        {/* 4. Share Card */}
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <h3 className="subtitle mb-3">Share</h3>
            
            <p className="body-text mb-4">
              Let your circle know you did something meaningful today.
            </p>
            
            <div className="space-y-4">
              <Button 
                variant="spotlight" 
                size="lg"
                className="w-full"
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
                <Share className="w-4 h-4 mr-2" />
                Share
              </Button>
              
              <Button variant="primary" size="lg" className="w-full" asChild>
                <Link to="/">Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* 5. Footer */}
        <div className="text-center pt-6 pb-6">
          <p className="text-sm mb-2">
            <span className="font-semibold text-primary">You're a verified constituent of {(() => {
              try {
                const storedData = localStorage.getItem('postcardData');
                if (storedData) {
                  const data = JSON.parse(storedData);
                  return data.userInfo?.city || 'your district';
                }
              } catch (error) {
                console.error('Error getting user city:', error);
              }
              return 'your district';
            })()}.</span> <span className="text-foreground">That means your message will be prioritized by your elected officials.</span>
          </p>
          <div className="flex justify-center gap-4 text-sm">
            <Link to="/privacy" className="text-primary hover:underline">Privacy</Link>
            <Link to="/help" className="text-primary hover:underline">Help</Link>
            <a href="https://canarycards.com" className="text-primary hover:underline">CanaryCards.com</a>
          </div>
        </div>

      </div>
    </div>
  );
}