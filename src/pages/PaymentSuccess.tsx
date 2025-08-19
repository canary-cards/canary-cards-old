import { useEffect, useState } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Share, Twitter, Facebook, Copy, Plus, BarChart3, Mail, Clock, ArrowLeft, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { HamburgerMenu } from '@/components/HamburgerMenu';

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
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center border border-primary">
            <img src="/postallogov1.svg" alt="Canary Cards Logo" className="w-6 h-6" />
          </div>
          <h1 className="display-title text-primary">Canary Cards</h1>
        </div>
        <HamburgerMenu />
      </div>

      {/* Main Content */}
      <div className="pt-24 pb-8 px-4 space-y-8 max-w-4xl mx-auto">
        
        {/* Section 1: Hero Celebration Card */}
        <Card className="bg-card border shadow-lg">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
            </div>
            
            <div className="space-y-4">
              <h1 className="display-title text-primary">
                Your voice is on its way to Washington
              </h1>
              
              <p className="subtitle text-secondary">
                Your postcard to {representative?.type === 'senator' ? 'Sen.' : 'Rep.'} {representative?.name?.split(' ').pop() || 'Your Representative'} will be handwritten and mailed within 24 hours
              </p>
              
              {/* Hero Postcard Image Placeholder */}
              <div className="flex justify-center">
                <div className="w-80 h-48 bg-muted rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/30">
                  <div className="text-center space-y-2">
                    <p className="text-muted-foreground font-medium">Image Here</p>
                    <p className="text-xs text-muted-foreground">Sample handwritten postcard</p>
                  </div>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground">
                Expected delivery: {deliveryDate}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Impact Proof Card */}
        <Card className="bg-card border shadow-lg">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <h2 className="display-title text-primary mb-6">
                You're one of {contactVolume} people contacting {representative?.type === 'senator' ? 'Sen.' : 'Rep.'} {representative?.name?.split(' ').pop() || 'Your Representative'} this week
              </h2>
              
              <div className="space-y-4 text-left max-w-2xl mx-auto">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="body-text">Handwritten postcards get read first</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="body-text">No spam folder, no screening delays</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                  <span className="body-text">Just 50 personalized postcards can influence a congressional vote</span>
                </div>
              </div>
              
              <p className="text-sm text-muted-foreground italic mt-6">
                — Congressional Management Foundation study
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Sharing Invitation Card */}
        <Card className="bg-card border shadow-lg">
          <CardHeader>
            <div className="eyebrow text-primary">HELP OTHERS SPEAK UP</div>
            <CardTitle className="subtitle text-secondary">Help someone else find their voice</CardTitle>
            <p className="body-text">
              Your friends can send their own postcard in under 2 minutes. Handwritten mail gets noticed.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Primary Sharing Button */}
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
              <Share className="w-5 h-5" />
              Share with Friends
            </Button>

            {/* Social Media Quick Shares */}
            <div className="grid grid-cols-3 gap-3">
              <Button variant="secondary" onClick={shareViaTwitter} className="p-3">
                <Twitter className="w-4 h-4" />
              </Button>
              <Button variant="secondary" onClick={shareViaFacebook} className="p-3">
                <Facebook className="w-4 h-4" />
              </Button>
              <Button variant="secondary" onClick={copyShareableLink} className="p-3">
                <Copy className="w-4 h-4" />
              </Button>
            </div>

            {shareableLink && (
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground">Share this link:</label>
                <Input value={shareableLink} readOnly className="text-sm" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Section 4: Next Steps Card */}
        <Card className="bg-muted/30 border shadow-lg">
          <CardHeader>
            <div className="eyebrow text-primary">WHAT'S NEXT</div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <Mail className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="body-text">Check your email for order confirmation and tracking</span>
              </div>
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <span className="body-text">We'll email you when your postcard is mailed</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button size="lg" className="flex-1" asChild>
                <Link to="/">
                  <Plus className="w-5 h-5" />
                  Send Another Postcard
                </Link>
              </Button>
              <Button variant="secondary" size="lg" className="flex-1" asChild>
                <Link to="/">
                  <User className="w-5 h-5" />
                  Home
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}