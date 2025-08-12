import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Mail, ArrowLeft, Copy, Share2, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
        toast({
          title: "Postcards ordered successfully!",
          description: `${data.summary.totalSent} postcard(s) ordered for your representatives.`,
        });
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-2 sm:p-4">
      <Card className="w-full max-w-lg">
        <CardContent className="p-4 sm:p-6 text-center space-y-3">
          <div className="flex justify-center">
            {getStatusIcon()}
          </div>
          
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              {getStatusTitle()}
            </h1>
            <p className="text-sm text-muted-foreground">
              {getStatusMessage()}
            </p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center space-x-2 text-xs sm:text-sm py-2">
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              Payment Complete
            </div>
            <div className="text-muted-foreground">→</div>
            <div className={`flex items-center ${postcardStatus === 'success' ? 'text-green-600' : postcardStatus === 'ordering' ? 'text-blue-600' : 'text-muted-foreground'}`}>
              {postcardStatus === 'ordering' ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 animate-spin" />
              ) : postcardStatus === 'success' ? (
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
              ) : (
                <div className="h-3 w-3 sm:h-4 sm:w-4 mr-1 rounded-full border-2 border-muted-foreground/30" />
              )}
              Postcard Ordering
            </div>
          </div>

          {sessionId && (
            <div className="bg-muted p-2 rounded-lg">
              <p className="text-xs text-muted-foreground">
                Order ID: {sessionId.slice(-12)}
              </p>
            </div>
          )}

          {postcardStatus === 'success' && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950 p-2 rounded-lg">
              <Mail className="h-3 w-3" />
              <span>You'll receive a confirmation email shortly</span>
            </div>
          )}

          {/* Error State with Retry */}
          {postcardStatus === 'error' && (
            <div className="space-y-2 p-3 bg-red-50 dark:bg-red-950 rounded-lg">
              <div className="text-xs text-red-700 dark:text-red-300">
                {orderingResults?.error || 'An error occurred while ordering your postcards.'}
              </div>
              <Button 
                onClick={retryPostcardOrdering}
                variant="outline" 
                size="sm"
                disabled={retryAttempts >= 3}
                className="text-xs"
              >
                {retryAttempts >= 3 ? 'Max retries reached' : `Retry (${retryAttempts}/3)`}
              </Button>
            </div>
          )}

          {/* Sending Results Details */}
          {postcardStatus === 'success' && orderingResults?.results && (
            <div className="space-y-1 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
              <h4 className="text-xs font-medium text-green-800 dark:text-green-200">Postcards Ordered:</h4>
              {orderingResults.results.map((result: any, index: number) => (
                <div key={index} className="text-xs text-green-700 dark:text-green-300">
                  ✓ {result.recipient} ({result.type})
                </div>
              ))}
            </div>
          )}

          {/* Shareable Link Section - Condensed */}
          {postcardStatus === 'success' && shareableLink && (
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-2 text-xs font-medium">
                <Share2 className="h-3 w-3" />
                <span>Share with Friends & Family</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    value={shareableLink}
                    readOnly
                    className="text-xs h-8"
                  />
                  <Button
                    onClick={copyShareableLink}
                    size="sm"
                    className="flex items-center gap-1 h-8 text-xs"
                  >
                    <Copy className="h-3 w-3" />
                    Share
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Encourage others to contact their representatives!
                </p>
              </div>
            </div>
          )}

          {/* Publish Message - Condensed */}
          {postcardStatus === 'success' && !shareableLink && (
            <div className="space-y-2 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="flex items-center gap-2 text-xs font-medium text-blue-800 dark:text-blue-200">
                <span>📢</span>
                <span>Ready to Share</span>
              </div>
              <p className="text-xs text-blue-700 dark:text-blue-300">
                Publish your project using the "Publish" button in the top right to get a shareable link!
              </p>
            </div>
          )}

          <Button 
            asChild 
            className="w-full h-10 mb-2"
            disabled={postcardStatus === 'processing' || postcardStatus === 'ordering'}
          >
            <Link to="/auth">Create Account</Link>
          </Button>

          <Button 
            asChild 
            className="w-full h-10"
            variant="outline"
            disabled={postcardStatus === 'processing' || postcardStatus === 'ordering'}
          >
            <Link to="/">Order Another Postcard</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}