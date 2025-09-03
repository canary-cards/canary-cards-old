import React, { useEffect, useState } from 'react';
import { useSearchParams, useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Share2, Copy, MessageSquare, Twitter, Facebook, Send, QrCode } from 'lucide-react';
import QRCode from 'qrcode';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';

export default function Share() {
  const [searchParams] = useSearchParams();
  const { orderId } = useParams();
  const [shareUrl, setShareUrl] = useState('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState('');
  const [isNativeShareAvailable, setIsNativeShareAvailable] = useState(false);
  const { toast } = useToast();

  const ref = searchParams.get('ref') || 'direct';
  const orderNumber = orderId || searchParams.get('order') || '';
  
  console.log('Share page loading with ref:', ref, 'orderNumber:', orderNumber);

  // Set the share URL immediately
  const baseShareUrl = 'https://canary.cards';

  const shareContent = {
    title: 'Canary Cards - Real Postcards to Representatives',
    text: 'I just sent a real postcard with Canary Cards! Friends listen to friends. Show them how easy it is to send a real postcard.',
    url: baseShareUrl
  };

  const handleNativeShare = async () => {
    console.log('Attempting native share with ref:', ref);
    if (navigator.share) {
      try {
        await navigator.share(shareContent);
        console.log('Shared successfully via native share');
        toast({
          title: "Thanks for sharing!",
          description: "Your friends can now easily contact their representatives too."
        });
      } catch (error) {
        console.log('Share cancelled or failed:', error);
        // Don't auto-fallback to copy when coming from email, let user choose
        if (ref !== 'email' && ref !== 'delivery') {
          handleCopyLink();
        }
      }
    } else {
      console.log('Native share not available, falling back to copy');
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

  useEffect(() => {
    // Set the share URL
    setShareUrl(baseShareUrl);
    
    // Generate QR code
    QRCode.toDataURL(baseShareUrl, { width: 200, margin: 2 })
      .then(url => setQrCodeDataUrl(url))
      .catch(err => console.error('QR code generation failed:', err));
    
    // Check if native sharing is available (mobile devices)
    const isNativeAvailable = 'share' in navigator;
    setIsNativeShareAvailable(isNativeAvailable);
    
    console.log('Share page loaded with ref:', ref, 'isNativeAvailable:', isNativeAvailable);
  }, []);


  const handleTextShare = () => {
    const message = `I just sent a real postcard with Canary Cards! ${shareUrl}`;
    const smsUrl = `sms:?body=${encodeURIComponent(message)}`;
    window.open(smsUrl, '_self');
  };

  const handleWhatsAppShare = () => {
    const message = `I just sent a real postcard with Canary Cards! ${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleMessengerShare = () => {
    const messengerUrl = `https://www.messenger.com/t/?link=${encodeURIComponent(shareUrl)}`;
    window.open(messengerUrl, '_blank');
  };

  const handleEmailShare = () => {
    const subject = shareContent.title;
    const body = `${shareContent.text}\n\nJoin me: ${shareUrl}\n\nTogether we can make a difference!`;
    const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_self');
  };

  const handleTwitterShare = () => {
    const text = "I just sent a real postcard with Canary Cards!";
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
    window.open(twitterUrl, '_blank');
  };

  const handleFacebookShare = () => {
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent('I just sent a real postcard with Canary Cards!')}`;
    window.open(facebookUrl, '_blank');
  };

  const getShareSourceMessage = () => {
    if (orderNumber) {
      return `Thanks for your order #${orderNumber}! Friends listen to friends.`;
    }
    return 'Friends listen to friends. Show them how easy it is to send a real postcard.';
  };

  // Check if user came from email or delivery
  const isFromEmail = ref === 'email' || ref === 'delivery';

  const handleScreenTap = () => {
    if (isFromEmail && isNativeShareAvailable) {
      handleNativeShare();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Full-screen tap area for email users */}
      {isFromEmail && isNativeShareAvailable ? (
        <div 
          className="fixed inset-0 z-40 bg-background flex items-center justify-center cursor-pointer"
          onClick={handleScreenTap}
          style={{ top: '80px' }} // Account for header height
        >
          <div className="text-center p-8 max-w-md mx-auto">
            <div className="text-8xl mb-8">📮</div>
            <h1 className="text-4xl font-bold text-foreground mb-6">
              Ready to Share!
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              Tap anywhere on this screen to share Canary Cards with your friends
            </p>
            <div className="animate-bounce text-2xl mb-4">👆</div>
            <div className="text-lg text-primary font-medium">
              Tap anywhere to share
            </div>
          </div>
        </div>
      ) : (
        // Regular share page content for non-email users
        <div className="container mx-auto px-4 py-8 max-w-md">

        {/* Main Share Card */}
        <Card className="shadow-sm mb-6">
          <CardContent className="p-6">
            {/* Primary Native Share Button */}
            {!isFromEmail && (
              <>
                {isNativeShareAvailable ? (
                  <Button 
                    onClick={handleNativeShare}
                    variant="primary" 
                    size="lg"
                    className="w-full mb-6"
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Share
                  </Button>
                ) : (
                  <Button
                    onClick={handleCopyLink}
                    variant="primary"
                    size="lg"
                    className="w-full mb-6"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                )}
              </>
            )}

            {/* Fallback Share Methods */}
            <div className="space-y-4">
              <div className="text-sm text-muted-foreground text-center">
                Or share via:
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleTextShare}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  SMS
                </Button>
                <Button
                  onClick={handleWhatsAppShare}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  WhatsApp
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={handleMessengerShare}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Send className="w-4 h-4 mr-2" />
                  Messenger
                </Button>
                <Button
                  onClick={handleTwitterShare}
                  variant="outline"
                  size="sm"
                  className="w-full"
                >
                  <Twitter className="w-4 h-4 mr-2" />
                  X
                </Button>
              </div>

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

            {/* Copy Link Fallback */}
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">Or copy this link:</p>
              <div className="flex gap-2">
                <Input
                  value={shareUrl}
                  readOnly
                  className="flex-1 text-sm"
                />
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="sm"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* QR Code */}
            {qrCodeDataUrl && (
              <div className="mt-6 pt-4 border-t border-border text-center">
                <p className="text-sm text-muted-foreground mb-3">
                  <QrCode className="w-4 h-4 inline mr-1" />
                  Scan to share on another device:
                </p>
                <img 
                  src={qrCodeDataUrl} 
                  alt="QR code for sharing Canary Cards"
                  className="mx-auto rounded-lg"
                  width={150}
                  height={150}
                />
              </div>
            )}
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
      )}
    </div>
  );
}