import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Mail, ArrowLeft, Copy, Share2, Loader2, AlertCircle, Clock, Truck, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { HamburgerMenu } from '@/components/HamburgerMenu';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [shareableLink, setShareableLink] = useState('');
  const [postcardStatus, setPostcardStatus] = useState<'processing' | 'ordering' | 'success' | 'error'>('processing');
  const [orderingResults, setOrderingResults] = useState<any>(null);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const { toast } = useToast();

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

  const orderPostcards = async () => {
    try {
      setPostcardStatus('ordering');
      console.log('Starting postcard ordering process...');
      
      const storedData = localStorage.getItem('postcardData');
      if (!storedData) {
        throw new Error('No postcard data found');
      }
      
      const postcardData = JSON.parse(storedData);
      console.log('Ordering postcard with data:', postcardData);
      
      const { data, error } = await supabase.functions.invoke('send-postcard', {
        body: { postcardData }
      });
      
      if (error) {
        console.error('Supabase function error:', error);
        throw error;
      }
      
      console.log('Postcard ordering results:', data);
      setOrderingResults(data);
      
      if (data.success) {
        setPostcardStatus('success');
      } else {
        setPostcardStatus('error');
        toast({
          title: "Some postcards failed to order",
          description: `${data.summary.totalSent} ordered, ${data.summary.totalFailed} failed.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to order postcards:', error);
      setPostcardStatus('error');
      setOrderingResults({ error: error.message });
      toast({
        title: "Failed to order postcards",
        description: "Please try again or contact support if the issue persists.",
        variant: "destructive",
      });
    }
  };

  const retryPostcardOrdering = async () => {
    setRetryAttempts(prev => prev + 1);
    await orderPostcards();
  };

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
    
    
    // Start postcard ordering process
    const timer = setTimeout(() => {
      orderPostcards();
    }, 1500); // Short delay to show processing state
    
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Show confetti only when postcards are successfully sent
    if (postcardStatus === 'success') {
      showConfetti();
    }
  }, [postcardStatus]);

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
          description: "Share this link with friends and family.",
        });
      } catch (err) {
        toast({
          title: "Failed to copy",
          description: "Please copy the link manually.",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusIcon = () => {
    switch (postcardStatus) {
      case 'processing':
      case 'ordering':
        return <Loader2 className="h-16 w-16 text-blue-500 animate-spin" />;
      case 'success':
        return <CheckCircle className="h-16 w-16 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-16 w-16 text-red-500" />;
      default:
        return <CheckCircle className="h-16 w-16 text-green-500" />;
    }
  };

  const getStatusTitle = () => {
    const postcardCount = orderingResults?.summary?.totalSent || 1;
    const postcardText = postcardCount === 1 ? "Postcard" : "Postcards";
    
    switch (postcardStatus) {
      case 'processing':
        return 'Preparing Your Postcards...';
      case 'ordering':
        return 'Ordering Your Postcards...';
      case 'success':
        return `${postcardCount} ${postcardText} Ordered Successfully!`;
      case 'error':
        return 'Postcard Ordering Failed';
      default:
        return 'Payment Complete!';
    }
  };

  const getStatusMessage = () => {
    switch (postcardStatus) {
      case 'processing':
        return 'Payment completed successfully! Preparing to order your postcards...';
      case 'ordering':
        return 'Your postcards are being ordered from your representatives. This may take a moment...';
      case 'success':
        return '';
      case 'error':
        return 'There was an issue ordering your postcards. You can retry or contact support.';
      default:
        return 'Payment complete! Your postcards are being processed.';
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-500 via-purple-500 to-blue-600">
      {/* Header with InkImpact branding and hamburger menu */}
      <div className="absolute top-4 left-4 right-4 z-10 flex items-center justify-between gap-4">
        {/* InkImpact Branding */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center border border-white/30">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-xl font-bold text-white">InkImpact</h1>
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
            <div className={`relative ${postcardStatus === 'success' ? 'animate-pulse' : ''}`}>
              {postcardStatus === 'success' ? (
                <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
              ) : postcardStatus === 'error' ? (
                <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center shadow-lg">
                  <AlertCircle className="w-10 h-10 text-white" />
                </div>
              ) : (
                <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center shadow-lg">
                  <Loader2 className="w-10 h-10 text-white animate-spin" />
                </div>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold">
              {postcardStatus === 'success' ? 'Payment Successful!' : 
               postcardStatus === 'error' ? 'Payment Failed' : 
               'Processing Payment...'}
            </h1>
            <p className="text-white/80 text-base">
              {postcardStatus === 'success' ? 'Your postcard is being prepared and will be sent to your representative.' :
               postcardStatus === 'error' ? 'There was an issue processing your order.' :
               'Please wait while we process your payment...'}
            </p>
          </div>
        </div>

        {/* Order Details Card */}
        <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
          <CardContent className="p-6">
            {/* Order ID */}
            {sessionId && (
              <>
                <div className="flex justify-between items-center py-3">
                  <span className="text-muted-foreground text-sm font-medium">Order ID</span>
                  <span className="font-mono text-sm">{sessionId.slice(-12)}</span>
                </div>
                <hr className="border-border" />
              </>
            )}
            
            {/* Status */}
            <div className="flex justify-between items-center py-3">
              <span className="text-muted-foreground text-sm font-medium">Status</span>
              <div className="flex items-center gap-2">
                {postcardStatus === 'success' ? (
                  <>
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-green-700 font-medium">Processing</span>
                  </>
                ) : postcardStatus === 'error' ? (
                  <>
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <span className="text-red-700 font-medium">Failed</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                    <span className="text-blue-700 font-medium">Processing</span>
                  </>
                )}
              </div>
            </div>

            {/* Confirmation Email */}
            {postcardStatus === 'success' && (
              <>
                <hr className="border-border" />
                <div className="flex justify-between items-center py-3">
                  <span className="text-muted-foreground text-sm font-medium">Confirmation Email</span>
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-blue-500" />
                    <span className="text-blue-700 font-medium">Sending shortly</span>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Representative Details */}
        {postcardStatus === 'success' && representative && (
          <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
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
          </Card>
        )}

        {/* What Happens Next */}
        {postcardStatus === 'success' && (
          <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">What happens next?</h3>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-foreground">Your postcard will be printed within 24 hours</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-foreground">It will be mailed within 2-3 business days</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-foreground">Delivery to your representative: 3-5 business days</span>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0"></div>
                  <span className="text-foreground">You'll receive email updates on the status</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Error State */}
        {postcardStatus === 'error' && (
          <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-6 text-center space-y-4">
              <div className="text-destructive">
                {orderingResults?.error || 'An error occurred while ordering your postcards.'}
              </div>
              <Button 
                onClick={retryPostcardOrdering}
                variant="outline" 
                size="lg"
                disabled={retryAttempts >= 3}
                className="w-full"
              >
                {retryAttempts >= 3 ? 'Max retries reached' : `Retry (${retryAttempts}/3)`}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Action Buttons */}
        {postcardStatus === 'success' && (
          <div className="space-y-3">
            <Button 
              asChild 
              variant="outline"
              className="w-full h-12 text-base font-medium bg-white/90 hover:bg-white border-white/50"
            >
              <Link to="/profile" className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Track This Order
              </Link>
            </Button>

            <Button 
              asChild 
              className="w-full h-12 text-base font-medium bg-primary hover:bg-primary/90"
            >
              <Link to="/" className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Send Another Postcard
              </Link>
            </Button>
          </div>
        )}

        {/* Share Section */}
        {postcardStatus === 'success' && (
          <Card className="bg-white/95 backdrop-blur-sm border-white/20 shadow-xl">
            <CardContent className="p-6">
              <div className="text-center space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Amplify Your Voice</h3>
                <p className="text-muted-foreground text-sm">
                  Encourage friends and family to contact their representatives too!
                </p>
                
                {shareableLink ? (
                  <div className="space-y-3">
                    <div className="flex gap-2">
                      <Input
                        value={shareableLink}
                        readOnly
                        className="text-sm"
                      />
                      <Button
                        onClick={copyShareableLink}
                        size="lg"
                        className="flex items-center gap-2 px-6"
                      >
                        <Copy className="w-4 h-4" />
                        Copy
                      </Button>
                    </div>
                    
                    <Button 
                      variant="outline"
                      className="w-full h-12 text-base font-medium"
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: 'Contact Your Representatives with InkImpact',
                            text: 'Make your voice heard by sending postcards to your representatives!',
                            url: shareableLink
                          });
                        }
                      }}
                    >
                      <Share2 className="w-5 h-5 mr-2" />
                      Share on Social Media
                    </Button>
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      📢 Publish your project using the "Publish" button in the top right to get a shareable link!
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}