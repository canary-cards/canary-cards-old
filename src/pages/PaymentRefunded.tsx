import { Link, useLocation } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { RefreshCcw, ArrowLeft, AlertCircle } from 'lucide-react';

export default function PaymentRefunded() {
  const location = useLocation();
  const urlParams = new URLSearchParams(location.search);
  
  // Get data from state or URL params (for testing)
  const { 
    failedCount = 1, 
    totalCount = 1, 
    refundAmountCents, 
    refundId, 
    errors = [] 
  } = location.state || {};
  
  const fallbackError = urlParams.get('error');
  const fallbackRefundId = urlParams.get('refundId');
  
  const displayFailedCount = failedCount;
  const displayTotalCount = totalCount;
  const displayRefundAmount = refundAmountCents ? (refundAmountCents / 100).toFixed(2) : null;
  const displayRefundId = refundId || fallbackRefundId;
  const displayErrors = errors.length > 0 ? errors : (fallbackError ? [fallbackError] : []);

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
                Hmm, something went wrong
              </h1>
              
              {displayFailedCount === displayTotalCount ? (
                <p className="body-text text-muted-foreground">
                  We weren't able to order your postcard{displayTotalCount > 1 ? 's' : ''}, and your payment has been refunded.
                </p>
              ) : (
                <p className="body-text text-muted-foreground">
                  {displayFailedCount} of {displayTotalCount} postcard{displayTotalCount > 1 ? 's' : ''} failed to order. 
                  We've issued a partial refund for the failed postcard{displayFailedCount > 1 ? 's' : ''}.
                </p>
              )}
              
              {displayRefundAmount && (
                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-3 mt-4">
                  <p className="text-sm font-medium">
                    Refund: ${displayRefundAmount}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    You'll see this refund in your account within 5–10 business days.
                  </p>
                </div>
              )}
              
              {displayErrors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 mt-4">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive mt-0.5 flex-shrink-0" />
                    <div className="text-sm text-destructive text-left">
                      <p className="font-medium">Error Details:</p>
                      {displayErrors.map((err: string, idx: number) => (
                        <p key={idx} className="mt-1">{err}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {displayRefundId && (
                <p className="text-sm text-muted-foreground">
                  Refund ID: {displayRefundId}
                </p>
              )}
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