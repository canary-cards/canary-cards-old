import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Copy, MessageSquare, Mail, Twitter, Facebook, Heart } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';

export default function Share() {
  const [searchParams] = useSearchParams();
  const [shareUrl, setShareUrl] = useState('');
  const [isNativeShareAvailable, setIsNativeShareAvailable] = useState(false);
  const { toast } = useToast();

  const ref = searchParams.get('ref') || 'direct';
  const orderNumber = searchParams.get('order') || '';

  useEffect(() => {
    // Set the share URL
    const baseUrl = window.location.origin;
    setShareUrl(baseUrl);
    
    // Check if native sharing is available (mobile devices)
    setIsNativeShareAvailable('share' in navigator);
  }, []);

  const shareContent = {
    title: 'Contact Your Representatives with Canary Cards',
    text: 'I just sent a real, handwritten postcard to my representative. It takes 2 minutes and actually gets read. Make your voice heard!',
    url: shareUrl
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share(shareContent);
        // Track successful share
        console.log('Shared successfully via native share');
      } catch (error) {
        // User cancelled or error occurred
        console.log('Share cancelled or failed:', error);
        // Fallback to copy
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast({
        title: "Link copied!",
        description: "Share this link with friends and family to help them get involved."
      });
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please copy the link manually.",
        variant: "destructive"
      });
    }
  };

  const handleTextShare = () => {
    const message = `${shareContent.text}\n\n${shareUrl}`;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_self');
  };

  const handleEmailShare = () => {
    const subject = shareContent.title;
    const body = `${shareContent.text}\n\nJoin me: ${shareUrl}\n\nTogether we can make a difference!`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_self');
  };

  const handleTwitterShare = () => {
    const text = "I just sent a real, handwritten postcard to my representative. It takes 2 minutes and actually gets read.";
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareContent.text)}`;
    window.open(facebookUrl, '_blank');
  };

  const getShareSourceMessage = () => {
    switch (ref) {
      case 'email':
        return orderNumber 
          ? `Thanks for your order #${orderNumber}! Help others get involved too.`
          : 'Thanks for checking out Canary Cards! Help others get involved.';
      case 'success':
        return 'Thanks for taking action! Share with others to amplify your impact.';
      default:
        return 'Help others make their voices heard in democracy.';
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <Heart className="w-8 h-8 text-accent-foreground" />
          </div>
          <h1 className="display-title mb-2">
            Share the Power
          </h1>
          <p className="body-text text-muted-foreground">
            {getShareSourceMessage()}
          </p>
        </div>

        {/* Main Share Card */}
        <Card className="shadow-sm mb-6">
          <CardContent className="p-6">
            <h2 className="subtitle mb-4">Spread the Word</h2>
            <p className="body-text mb-6">
              Every voice matters. Share Canary Cards with friends and family to help them easily contact their representatives.
            </p>

            {/* Primary Share Button */}
            {isNativeShareAvailable ? (
              <Button 
                onClick={handleNativeShare}
                variant="spotlight" 
                size="lg"
                className="w-full mb-4"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share with Friends
              </Button>
            ) : (
              <div className="space-y-3 mb-4">
                <div className="flex gap-2">
                  <Input
                    value={shareUrl}
                    readOnly
                    className="flex-1"
                    placeholder="Share link"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="lg"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Alternative Share Methods */}
            <div className="space-y-3">
              <div className="text-sm text-muted-foreground text-center">
                Or share via:
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleTextShare}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Text
                </Button>
                <Button
                  onClick={handleEmailShare}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Mail className="w-4 h-4 mr-2" />
                  Email
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={handleTwitterShare}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </Button>
                <Button
                  onClick={handleFacebookShare}
                  variant="outline" 
                  size="sm"
                  className="w-full"
                >
                  <Facebook className="w-4 h-4 mr-2" />
                  Facebook
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Call to Action */}
        <Card className="shadow-sm">
          <CardContent className="p-6 text-center">
            <h3 className="subtitle mb-2">
              Ready to Make Your Voice Heard?
            </h3>
            <p className="body-text mb-4">
              Send your own handwritten postcard to your representatives in just 2 minutes.
            </p>
            <Button 
              variant="primary" 
              size="lg" 
              className="w-full"
              asChild
            >
              <Link to="/">
                Get Started
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}