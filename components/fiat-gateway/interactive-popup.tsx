'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { AlertCircle, CheckCircle2, ExternalLink, Shield, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface InteractivePopupProps {
  /** The URL of the anchor's interactive flow */
  url: string;
  /** Whether the popup is open */
  open: boolean;
  /** Callback when the popup should close */
  onClose: () => void;
  /** Callback when the transaction is completed */
  onComplete?: (result: TransactionResult) => void;
  /** Callback when an error occurs */
  onError?: (error: string) => void;
  /** The anchor domain for security validation */
  anchorDomain: string;
  /** Title for the dialog */
  title?: string;
  /** Description for the dialog */
  description?: string;
  /** Whether to allow closing the dialog */
  allowClose?: boolean;
}

interface TransactionResult {
  status: 'completed' | 'pending_user_transfer_start' | 'pending_anchor' | 'pending_stellar' | 'pending_external' | 'pending_trust' | 'pending_user';
  transactionId?: string;
  stellarTransactionId?: string;
  externalTransactionId?: string;
  message?: string;
}

interface PostMessageEvent {
  type: 'transaction_status' | 'transaction_complete' | 'transaction_error';
  payload?: {
    status?: string;
    transaction?: {
      id?: string;
      stellar_transaction_id?: string;
      external_transaction_id?: string;
    };
    message?: string;
    error?: string;
  };
}

export function InteractivePopup({
  url,
  open,
  onClose,
  onComplete,
  onError,
  anchorDomain,
  title = 'Complete Transaction',
  description = 'Follow the instructions in the anchor\'s interface to complete your transaction',
  allowClose = true,
}: InteractivePopupProps) {
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [progress, setProgress] = React.useState(0);
  const [securityVerified, setSecurityVerified] = React.useState(false);
  const iframeRef = React.useRef<HTMLIFrameElement>(null);
  const progressIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  // Validate iframe source against anchor domain
  const isValidSource = React.useCallback((origin: string): boolean => {
    try {
      const urlObj = new URL(url);
      const originObj = new URL(origin);
      
      // Check if the origin matches the anchor domain
      return (
        originObj.hostname === urlObj.hostname ||
        originObj.hostname.endsWith(`.${anchorDomain}`) ||
        urlObj.hostname.endsWith(`.${anchorDomain}`)
      );
    } catch (e) {
      console.error('Invalid URL in source validation:', e);
      return false;
    }
  }, [url, anchorDomain]);

  // Handle post messages from iframe
  React.useEffect(() => {
    if (!open) return;

    const handleMessage = (event: MessageEvent) => {
      // Security check: validate message origin
      if (!isValidSource(event.origin)) {
        console.warn('Received message from untrusted origin:', event.origin);
        return;
      }

      try {
        const data = event.data as PostMessageEvent;

        switch (data.type) {
          case 'transaction_status':
            // Update progress based on status
            if (data.payload?.status) {
              setProgress(getProgressForStatus(data.payload.status));
            }
            break;

          case 'transaction_complete':
            // Transaction completed successfully
            setProgress(100);
            if (onComplete && data.payload) {
              const result: TransactionResult = {
                status: (data.payload.status as TransactionResult['status']) || 'completed',
                transactionId: data.payload.transaction?.id,
                stellarTransactionId: data.payload.transaction?.stellar_transaction_id,
                externalTransactionId: data.payload.transaction?.external_transaction_id,
                message: data.payload.message,
              };
              onComplete(result);
            }
            // Auto-close after a short delay
            setTimeout(() => {
              onClose();
            }, 2000);
            break;

          case 'transaction_error':
            // Handle error from anchor
            const errorMessage = data.payload?.error || data.payload?.message || 'An error occurred during the transaction';
            setError(errorMessage);
            if (onError) {
              onError(errorMessage);
            }
            break;

          default:
            // Unknown message type
            console.log('Unknown message type:', data.type);
        }
      } catch (e) {
        console.error('Error processing message:', e);
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [open, isValidSource, onComplete, onError, onClose]);

  // Simulate progress for better UX
  React.useEffect(() => {
    if (!open || !loading) return;

    progressIntervalRef.current = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 10;
      });
    }, 500);

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, [open, loading]);

  // Handle iframe load
  const handleIframeLoad = () => {
    setLoading(false);
    setSecurityVerified(true);
    setProgress(20);
  };

  // Handle iframe error
  const handleIframeError = () => {
    setLoading(false);
    setError('Failed to load the anchor\'s interface. Please try again.');
    if (onError) {
      onError('Failed to load anchor interface');
    }
  };

  // Reset state when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      setProgress(0);
      setSecurityVerified(false);
    } else {
      // Clean up when closing
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    }
  }, [open]);

  // Handle close with confirmation if transaction is in progress
  const handleClose = () => {
    if (!allowClose && progress > 0 && progress < 100) {
      const confirmed = window.confirm(
        'Are you sure you want to close? Your transaction may not be completed.'
      );
      if (!confirmed) return;
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className="max-w-4xl h-[80vh] flex flex-col p-0"
        onInteractOutside={(e) => {
          if (!allowClose) {
            e.preventDefault();
          }
        }}
        aria-labelledby="interactive-popup-title"
        aria-describedby="interactive-popup-description"
      >
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle id="interactive-popup-title" className="flex items-center gap-2">
                {title}
                {securityVerified && (
                  <Shield className="h-4 w-4 text-green-500" title="Secure connection verified" aria-label="Secure connection verified" />
                )}
              </DialogTitle>
              <DialogDescription id="interactive-popup-description" className="mt-1">
                {description}
              </DialogDescription>
            </div>
            {allowClose && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="h-8 w-8"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </Button>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Progress Bar */}
          {loading || (progress > 0 && progress < 100) ? (
            <div className="px-6 py-3 border-b bg-muted/30" role="status" aria-live="polite">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-muted-foreground">
                  {loading ? 'Loading secure interface...' : 'Processing transaction...'}
                </span>
                <span className="text-xs font-medium" aria-label={`Progress: ${Math.round(progress)} percent`}>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-1" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} />
            </div>
          ) : null}

          {/* Error Display */}
          {error && (
            <div className="px-6 py-4 border-b">
              <Alert variant="destructive" role="alert" aria-live="assertive">
                <AlertCircle className="h-4 w-4" aria-hidden="true" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                  {error}
                  <div className="mt-3 flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setError(null);
                        setLoading(true);
                        if (iframeRef.current) {
                          iframeRef.current.src = url;
                        }
                      }}
                      aria-label="Retry loading anchor interface"
                    >
                      Try Again
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleClose} aria-label="Close dialog">
                      Close
                    </Button>
                  </div>
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Success Display */}
          {progress === 100 && !error && (
            <div className="px-6 py-4 border-b">
              <Alert role="status" aria-live="polite">
                <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
                <AlertTitle>Transaction Complete</AlertTitle>
                <AlertDescription>
                  Your transaction has been completed successfully. This window will close automatically.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Iframe Container */}
          <div className="flex-1 relative bg-background">
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-background z-10" role="status" aria-live="polite">
                <div className="text-center space-y-4">
                  <Spinner className="h-8 w-8 mx-auto" aria-label="Loading" />
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Loading secure interface</p>
                    <p className="text-xs text-muted-foreground">
                      Connecting to {anchorDomain}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <iframe
              ref={iframeRef}
              src={url}
              className={cn(
                'w-full h-full border-0',
                loading && 'opacity-0'
              )}
              title={`Anchor Interactive Flow - ${anchorDomain}`}
              sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox"
              onLoad={handleIframeLoad}
              onError={handleIframeError}
              allow="payment"
              aria-label="Anchor payment interface"
            />
          </div>

          {/* Security Notice */}
          <div className="px-6 py-3 border-t bg-muted/30" role="contentinfo">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Shield className="h-3 w-3" aria-hidden="true" />
                <span>Secure connection to {anchorDomain}</span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="h-auto py-1 px-2 text-xs"
                onClick={() => window.open(url, '_blank')}
                aria-label={`Open anchor interface in new tab for ${anchorDomain}`}
              >
                <ExternalLink className="h-3 w-3 mr-1" aria-hidden="true" />
                Open in new tab
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper function to map transaction status to progress percentage
function getProgressForStatus(status: string): number {
  const statusMap: Record<string, number> = {
    'incomplete': 20,
    'pending_user_transfer_start': 30,
    'pending_user': 40,
    'pending_anchor': 50,
    'pending_stellar': 60,
    'pending_external': 70,
    'pending_trust': 40,
    'pending_user_transfer_complete': 80,
    'completed': 100,
    'refunded': 100,
    'expired': 100,
    'error': 100,
  };

  return statusMap[status] || 50;
}
