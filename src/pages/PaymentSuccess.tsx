import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CheckCircle, Mail, ArrowLeft, Copy, Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [showConfetti, setShowConfetti] = useState(false);
  const [shareableLink, setShareableLink] = useState('');
  const { toast } = useToast();

  // Get user's first name from localStorage (stored during the flow)
  const getUserFirstName = () => {
    try {
      const storedData = localStorage.getItem('postcardData');
      if (storedData) {
        const data = JSON.parse(storedData);
        return data.userInfo?.firstName || 'Friend';
      }
    } catch (error) {
      console.error('Error getting user data:', error);
    }
    return 'Friend';
  };

  useEffect(() => {
    // Show confetti animation
    setShowConfetti(true);
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    
    // Generate shareable link automatically
    const firstName = getUserFirstName();
    const link = `${window.location.origin}/?shared_by=${encodeURIComponent(firstName)}`;
    setShareableLink(link);
    
    return () => clearTimeout(timer);
  }, []);

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex items-center justify-center p-4">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                fontSize: `${Math.random() * 20 + 10}px`,
              }}
            >
              🎉
            </div>
          ))}
        </div>
      )}
      
      <Card className="w-full max-w-md">
        <CardContent className="p-8 text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle className="h-16 w-16 text-green-500" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Payment Successful!
            </h1>
            <p className="text-muted-foreground">
              Your postcard is being processed and will be sent to your representative.
            </p>
          </div>

          {sessionId && (
            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                Order ID: {sessionId.slice(-12)}
              </p>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
            <Mail className="h-4 w-4" />
            <span>You'll receive a confirmation email shortly</span>
          </div>

          {/* Shareable Link Section */}
          <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Share2 className="h-4 w-4" />
              <span>Share with Friends & Family</span>
            </div>
            
            <div className="space-y-3">
              <div className="flex gap-2">
                <Input
                  value={shareableLink}
                  readOnly
                  className="text-xs"
                />
                <Button
                  onClick={copyShareableLink}
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <Copy className="h-3 w-3" />
                  Share
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link to encourage others to contact their representatives!
              </p>
            </div>
          </div>

          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link to="/">Send Another Postcard</Link>
            </Button>
            
            <Button variant="outline" asChild className="w-full">
              <Link to="/">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Home
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}