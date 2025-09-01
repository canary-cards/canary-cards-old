import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { RefreshCcw, ArrowLeft, AlertCircle } from 'lucide-react';

export default function PaymentRefunded() {
  const location = useLocation();
  const { error, refundId } = location.state || {};

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted flex flex-col">
      <Header />
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardContent className="p-8 text-center space-y-6">
            <div className="flex justify-center">
              <RefreshCcw className="h-16 w-16 text-yellow-500" />
            </div>
            
            <div className="space-y-3">
              <h1 className="text-2xl display-title">
                Payment Refunded
              </h1>
              <p className="body-text text-muted-foreground">
                We weren't able to create your postcard, and your payment has been refunded.
              </p>
              
              {error && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-destructive text-left">
                      <p className="font-medium">Error Details:</p>
                      <p className="mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              )}
              
              {refundId && (
                <p className="text-sm text-muted-foreground">
                  Refund ID: {refundId}
                </p>
              )}
              
              <p className="text-sm text-muted-foreground">
                Your refund should appear in your account within 5-10 business days.
              </p>
            </div>

            <div className="space-y-3">
              <Button asChild className="w-full">
                <Link to="/onboarding">
                  <RefreshCcw className="h-4 w-4 mr-2" />
                  Try Again
                </Link>
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
    </div>
  );
}