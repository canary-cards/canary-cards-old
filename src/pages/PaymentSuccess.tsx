import { useEffect, useState } from 'react';
import { useSearchParams, useLocation, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Mail, ArrowLeft, Copy, Share2, Loader2, AlertCircle, Clock, Truck, BarChart3, UserPlus, MessageCircle, Send, Eye, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { HamburgerMenu } from '@/components/HamburgerMenu';
export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const sessionId = searchParams.get('session_id') || location.state?.sessionId;
  const [shareableLink, setShareableLink] = useState('');
  const [postcardStatus, setPostcardStatus] = useState<'success'>('success');
  const [orderingResults, setOrderingResults] = useState<any>(location.state?.orderingResults || null);
  const {
    toast
  } = useToast();

  // Get user's name from localStorage (stored during the flow)
  const getUserName = () => {
    try {
      const storedData = localStorage.getItem('postcardData');
      if (storedData) {
        const data = JSON.parse(storedData);
        const fullName = data.userInfo?.fullName;
        if (fullName) {
          const nameParts = fullName.trim().split(' ');
          if (nameParts.length >= 2) {
            const firstName = nameParts[0];
            const lastName = nameParts[nameParts.length - 1];
            return `${firstName} ${lastName.charAt(0)}.`;
          } else {
            return nameParts[0];
          }
        }
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }
    return 'Friend';
  };

  // Postcard ordering is now handled in PaymentReturn component
  // This page only displays the final success state

  // Get the deployed app URL, not the Lovable editor URL
  const getAppUrl = () => {
    // If we're in the Lovable editor, user needs to publish first
    if (window.location.origin.includes('lovable.app') && window.location.pathname.includes('/edit/')) {
      return null; // Will show a publish message instead
    }
    // For deployed app or custom domain, use current origin
    return window.location.origin;
  };
  useEffect(() => {
    // Generate shareable link automatically
    const userName = getUserName();
    const appUrl = getAppUrl();
    if (appUrl) {
      const link = `${appUrl}/?shared_by=${encodeURIComponent(userName)}`;
      setShareableLink(link);
    }
  }, []);
  useEffect(() => {
    // Show confetti immediately since we only reach this page on success
    showConfetti();
  }, []);
  const showConfetti = () => {
    const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];
    for (let i = 0; i < 50; i++) {
      createConfettiPiece(colors[Math.floor(Math.random() * colors.length)]);
    }
  };
  const createConfettiPiece = (color: string) => {
    const confetti = document.createElement('div');
    confetti.style.cssText = `
      position: fixed;
      width: 10px;
      height: 10px;
      background: ${color};
      left: ${Math.random() * 100}vw;
      top: -10px;
      z-index: 1000;
      border-radius: 50%;
      animation: confetti-fall ${Math.random() * 3 + 2}s linear forwards;
    `;
    document.body.appendChild(confetti);

    // Add CSS animation
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
    setTimeout(() => {
      confetti.remove();
    }, 5000);
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

  // Status functions removed since this page only shows success state

  // Get representative data from localStorage
  const getRepresentativeData = () => {
    try {
      const storedData = localStorage.getItem('postcardData');
      if (storedData) {
        const data = JSON.parse(storedData);
        const representatives = data.selectedRepresentatives || [];
        return representatives[0] || null; // Get first representative for display
      }
    } catch (error) {
      console.error('Error getting representative data:', error);
    }
    return null;
  };
  const representative = getRepresentativeData();
  return <div className="min-h-screen bg-gradient-to-br from-indigo-400 via-indigo-500 to-violet-500">
      {/* Header with Canary Cards branding and hamburger menu */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-4">
        {/* Canary Cards Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">Canary Cards</h1>
        </div>
        
        {/* Hamburger menu */}
        <div className="flex-shrink-0">
          <HamburgerMenu />
        </div>
      </div>

      {/* Content */}
      <div className="pt-24 pb-8 px-4 space-y-6 max-w-md mx-auto">
        {/* Success Header */}
        <div className="text-center text-white space-y-4">
          <div className="flex justify-center">
            <div className="relative animate-pulse">
              <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">Order Successful!</h1>
            <p className="text-white/80 text-base">
              Your postcard has been ordered and will be sent to your representative.
            </p>
          </div>
        </div>

        {/* Order Details Card */}
        <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
          <CardContent className="p-6">
            {/* Email with Preview - Enhanced */}
            <div className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Eye className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">Email with Preview</h4>
                  <p className="text-xs text-muted-foreground">Includes a preview of your handwritten postcard</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-green-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium text-sm">Sent</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Representative Details */}
        {representative && <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Mail className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">Your Postcard Details</h3>
              </div>
              
              <div className="bg-white rounded-xl p-4 flex items-center gap-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center text-white font-bold text-lg">
                  {representative.name ? representative.name.split(' ').map(n => n[0]).join('').slice(0, 2) : 'SM'}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">
                    {representative.name || 'Seth Magaziner'}
                  </h4>
                  <p className="text-muted-foreground text-sm">
                    {representative.title || 'U.S. Representative'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>}

        {/* What Happens Next */}
          <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">What happens next?</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-foreground">Your postcard will be handwritten by robots and mailed within 3 business days</span>
                </div>
                
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-foreground">It will be delivered to your representative 4-6 business days after that</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-foreground">You'll receive an email when it's been put in the mail</span>
                </div>
              </div>
            </CardContent>
          </Card>
        
        {/* Share Section - Improved UX */}
        {shareableLink && <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Multiply Your Impact</h3>
                <p className="text-muted-foreground text-sm">
                  Share this link so friends and family can contact their representatives too
                </p>
                
                {shareableLink ? <div className="space-y-4">
                    {/* Primary Share Action */}
                    <Button size="lg" className="w-full h-12 text-base font-medium" onClick={() => {
                if (navigator.share) {
                  navigator.share({
                    title: 'Contact Your Representatives with Canary Cards',
                    text: 'Make your voice heard by sending postcards to your representatives!',
                    url: shareableLink
                  });
                } else {
                  // Fallback for desktop - copy to clipboard
                  copyShareableLink();
                }
              }}>
                      <Share2 className="w-5 h-5 mr-2" />
                      Share with Friends
                    </Button>
                    
                    {/* Secondary Copy Action */}
                    <div className="space-y-2">
                      <p className="text-xs text-muted-foreground">Or copy the link:</p>
                      <div className="flex gap-2">
                        <Input value={shareableLink} readOnly className="text-sm" />
                        <Button onClick={copyShareableLink} variant="secondary" size="lg" className="flex items-center gap-2 px-4">
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div> : <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      📢 Publish your project using the "Publish" button in the top right to get a shareable link!
                    </p>
                  </div>}
              </div>
            </CardContent>
          </Card>}

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Button asChild variant="secondary" className="h-12 text-base font-medium bg-white/90 hover:bg-white border-white/50">
              <Link to="/" className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Send Another
              </Link>
            </Button>

            <Button asChild className="h-12 text-base font-medium bg-primary hover:bg-primary/90">
              <Link to="/auth" className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Create Account
              </Link>
            </Button>
          </div>
        </div>
        
      </div>
    </div>;
}