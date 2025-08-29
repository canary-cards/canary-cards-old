import { useEffect, useState } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Share, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const [shareableLink, setShareableLink] = useState('');
  const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
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
      animation: confetti-fall ${Math.random() * 4 + 2.4}s linear forwards;
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
    
    setTimeout(() => confetti.remove(), 6000);
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
      <Header />

      {/* Main Content */}
      <div className="max-w-md mx-auto px-4 pt-4 space-y-6">
        
        {/* Top section with checkmark and headlines */}
        <div className="text-center space-y-4">
          <div className="flex justify-center">
            <CheckCircle className="w-8 h-8 text-accent" />
          </div>
          
          <h1 className="display-title">
            Order Successful
          </h1>
          
          <p className="subtitle">
            We're getting to work writing your postcard.
          </p>
        </div>

        {/* Card 1 - Order details (collapsible, default closed) */}
        <div className="relative">
          <Collapsible open={isOrderDetailsOpen} onOpenChange={setIsOrderDetailsOpen}>
            <div className={`rounded-lg border-2 p-4 transition-all bg-white ${isOrderDetailsOpen ? 'border-primary' : 'border-border'}`}>
              <CollapsibleTrigger className="w-full text-left">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <span className="display-title text-lg">
                      Order #{orderData.orderNumber} – {orderData.recipients.length} Card{orderData.recipients.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {isOrderDetailsOpen ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="pt-4 space-y-2">
                  {orderData.recipients.map((recipient, index) => (
                    <div key={index} className="body-text">
                      {recipient}
                    </div>
                  ))}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
          
          {/* Confirmed badge positioned over top right corner */}
          <div className="absolute -top-2 -right-2 z-10">
            <div className="flex items-center gap-2 px-3 py-1 bg-accent text-accent-foreground text-sm rounded-md shadow-md">
              <CheckCircle className="w-3 h-3" />
              Confirmed
            </div>
          </div>
        </div>

        {/* Card 2 - What Happens Next */}
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center gap-3 mb-4">
              <img src="/smallonboarding3.svg" alt="Robot arm" className="w-6 h-6" />
              <h3 className="subtitle">What Happens Next</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 flex-shrink-0"></div>
                <p className="body-text">A copy of your postcard is already in your inbox.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 flex-shrink-0"></div>
                <p className="body-text">We'll hand-write and mail it within 3 business days.</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-foreground mt-2 flex-shrink-0"></div>
                <p className="body-text">You'll get an email once it's in the mail.</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Card 3 - Share section */}
        <Card className="shadow-sm">
          <CardContent className="p-5">
            <h3 className="subtitle text-rust mb-2">Friends listen to friends.</h3>
            
            <p className="body-text mb-4">
              Thanks for taking real action. Your postcard is part of a growing wave reaching leaders' desks.
            </p>
            
            <div className="space-y-4">
              <Button 
                variant="primary" 
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
                Share
              </Button>
              
              <Button variant="spotlight" size="lg" className="w-full" asChild>
                <Link to="/">Home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}