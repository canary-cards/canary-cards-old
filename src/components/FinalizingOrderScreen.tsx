interface FinalizingOrderScreenProps {
  status: 'loading' | 'error';
  onRetry?: () => void;
}

export const FinalizingOrderScreen = ({ status, onRetry }: FinalizingOrderScreenProps) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10 flex items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-md">
        {status === 'loading' && (
          <div className="space-y-4">
            <h1 className="display-title">
              Finalizing your order…
            </h1>
            <p className="subtitle text-lg">
              We're securely sending your postcard details to be written and mailed.
            </p>
          </div>
        )}
        
        {status === 'error' && (
          <div className="space-y-4">
            <h1 className="display-title">
              Oops! Something Went Wrong
            </h1>
            <p className="text-lg text-muted-foreground">
              There was an issue processing your postcard order. Don't worry - your payment was successful.
            </p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-6 py-3 bg-primary text-primary-foreground rounded-xl font-medium hover:bg-primary/90 transition-colors button-warm"
                aria-label="Retry postcard order"
              >
                Try Again
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};