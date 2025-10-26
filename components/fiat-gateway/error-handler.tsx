'use client';

import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  AlertCircle, 
  AlertTriangle,
  RefreshCw, 
  Shield,
  Wifi,
  WifiOff,
  XCircle,
  Info,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { withRetry, type RetryOptions } from '@/lib/stellar/retry';
import { 
  handleStellarError, 
  type UserFriendlyMessage,
  isNetworkError,
  isInsufficientFundsError,
  isUserRejectedError,
  ErrorCode
} from '@/lib/stellar/errors';
import { StellarError } from '@/lib/stellar/types';

/**
 * Error type classification
 */
export type ErrorType = 
  | 'network'
  | 'insufficient_funds'
  | 'trustline'
  | 'anchor_unavailable'
  | 'wallet'
  | 'validation'
  | 'timeout'
  | 'unknown';

/**
 * Error handler props
 */
export interface ErrorHandlerProps {
  error: Error | StellarError | null;
  onRetry?: () => void | Promise<void>;
  onDismiss?: () => void;
  onRecovery?: () => void;
  className?: string;
  showDetails?: boolean;
}

/**
 * Classify error type
 */
function classifyError(error: Error | StellarError): ErrorType {
  if (isNetworkError(error)) return 'network';
  if (isInsufficientFundsError(error)) return 'insufficient_funds';
  if (isUserRejectedError(error)) return 'wallet';
  
  if (error instanceof StellarError) {
    switch (error.code) {
      case ErrorCode.ANCHOR_ERROR:
        return 'anchor_unavailable';
      case ErrorCode.WALLET_ERROR:
        return 'wallet';
      case ErrorCode.INVALID_PARAMS:
        return 'validation';
      case ErrorCode.TRANSACTION_FAILED:
        return 'timeout';
      default:
        return 'unknown';
    }
  }
  
  // Check error message for specific patterns
  const message = error.message.toLowerCase();
  if (message.includes('trustline')) return 'trustline';
  if (message.includes('network') || message.includes('timeout')) return 'network';
  if (message.includes('insufficient') || message.includes('balance')) return 'insufficient_funds';
  if (message.includes('anchor')) return 'anchor_unavailable';
  
  return 'unknown';
}

/**
 * Get error severity
 */
function getErrorSeverity(errorType: ErrorType): 'error' | 'warning' | 'info' {
  switch (errorType) {
    case 'network':
    case 'timeout':
      return 'warning';
    case 'wallet':
      return 'info';
    case 'insufficient_funds':
    case 'trustline':
    case 'anchor_unavailable':
    case 'validation':
    case 'unknown':
      return 'error';
  }
}

/**
 * Main error handler component
 */
export function ErrorHandler({
  error,
  onRetry,
  onDismiss,
  onRecovery,
  className,
  showDetails = false,
}: ErrorHandlerProps) {
  const [showDetailsExpanded, setShowDetailsExpanded] = React.useState(false);
  
  if (!error) return null;

  const errorType = classifyError(error);
  const severity = getErrorSeverity(errorType);
  const userMessage = error instanceof StellarError 
    ? handleStellarError(error)
    : {
        title: 'Error',
        message: error.message,
        severity: 'error' as const,
      };

  const Icon = severity === 'error' ? AlertCircle : severity === 'warning' ? AlertTriangle : Info;

  return (
    <Alert variant={severity === 'error' ? 'destructive' : 'default'} className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{userMessage.title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{userMessage.message}</p>
        
        {userMessage.action && (
          <p className="text-sm font-medium">{userMessage.action}</p>
        )}

        {/* Recovery actions */}
        <div className="flex flex-wrap gap-2 mt-3">
          {onRetry && (
            <Button size="sm" variant="outline" onClick={onRetry}>
              <RefreshCw className="h-3 w-3 mr-1" />
              Try Again
            </Button>
          )}
          
          {onRecovery && (
            <Button size="sm" variant="outline" onClick={onRecovery}>
              Fix Issue
            </Button>
          )}
          
          {onDismiss && (
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
          )}
        </div>

        {/* Error details toggle */}
        {showDetails && (
          <div className="mt-3">
            <Button
              variant="ghost"
              size="sm"
              className="h-auto p-0 text-xs"
              onClick={() => setShowDetailsExpanded(!showDetailsExpanded)}
            >
              {showDetailsExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3 mr-1" />
                  Hide Details
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3 mr-1" />
                  Show Details
                </>
              )}
            </Button>
            
            {showDetailsExpanded && (
              <div className="mt-2 p-2 rounded bg-muted text-xs font-mono break-all">
                <p><strong>Type:</strong> {errorType}</p>
                <p><strong>Message:</strong> {error.message}</p>
                {error instanceof StellarError && error.details && (
                  <p><strong>Details:</strong> {JSON.stringify(error.details, null, 2)}</p>
                )}
              </div>
            )}
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
}

/**
 * Network error recovery component
 */
export interface NetworkErrorRecoveryProps {
  onRetry: () => void | Promise<void>;
  onDismiss?: () => void;
  retryOptions?: RetryOptions;
}

export function NetworkErrorRecovery({
  onRetry,
  onDismiss,
  retryOptions,
}: NetworkErrorRecoveryProps) {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [retryAttempt, setRetryAttempt] = React.useState(0);
  const [isOnline, setIsOnline] = React.useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      await withRetry(
        async () => {
          await onRetry();
        },
        {
          ...retryOptions,
          onRetry: (attempt) => {
            setRetryAttempt(attempt);
          },
        }
      );
    } catch (error) {
      console.error('Retry failed:', error);
    } finally {
      setIsRetrying(false);
      setRetryAttempt(0);
    }
  };

  return (
    <Card className="border-orange-500/50 bg-orange-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          {isOnline ? (
            <Wifi className="h-5 w-5 text-orange-500" />
          ) : (
            <WifiOff className="h-5 w-5 text-red-500" />
          )}
          <div>
            <CardTitle className="text-base">
              {isOnline ? 'Connection Issue' : 'No Internet Connection'}
            </CardTitle>
            <CardDescription>
              {isOnline 
                ? 'Unable to reach the server. This might be temporary.'
                : 'Please check your internet connection and try again.'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isRetrying && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Retrying...</span>
              <span className="text-muted-foreground">Attempt {retryAttempt}</span>
            </div>
            <Progress value={33} className="h-2" />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={handleRetry}
            disabled={isRetrying || !isOnline}
            size="sm"
            className="flex-1"
          >
            <RefreshCw className={cn('h-4 w-4 mr-2', isRetrying && 'animate-spin')} />
            {isRetrying ? 'Retrying...' : 'Retry Now'}
          </Button>
          
          {onDismiss && (
            <Button
              variant="outline"
              onClick={onDismiss}
              disabled={isRetrying}
              size="sm"
            >
              Cancel
            </Button>
          )}
        </div>

        {!isOnline && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              The retry button will be enabled once your connection is restored.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Insufficient funds recovery component
 */
export interface InsufficientFundsRecoveryProps {
  requiredAmount: string;
  currentBalance: string;
  currency: string;
  onAddFunds?: () => void;
  onDismiss?: () => void;
}

export function InsufficientFundsRecovery({
  requiredAmount,
  currentBalance,
  currency,
  onAddFunds,
  onDismiss,
}: InsufficientFundsRecoveryProps) {
  const shortfall = (parseFloat(requiredAmount) - parseFloat(currentBalance)).toFixed(4);

  return (
    <Card className="border-red-500/50 bg-red-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          <div>
            <CardTitle className="text-base">Insufficient Balance</CardTitle>
            <CardDescription>
              You don't have enough funds to complete this transaction
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Required</p>
            <p className="text-sm font-bold">{requiredAmount} {currency}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current</p>
            <p className="text-sm font-bold">{currentBalance} {currency}</p>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Needed</p>
            <p className="text-sm font-bold text-red-500">{shortfall} {currency}</p>
          </div>
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            Add at least {shortfall} {currency} to your wallet to proceed with this transaction.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          {onAddFunds && (
            <Button onClick={onAddFunds} size="sm" className="flex-1">
              Add Funds
            </Button>
          )}
          
          {onDismiss && (
            <Button variant="outline" onClick={onDismiss} size="sm">
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Trustline error recovery component
 */
export interface TrustlineErrorRecoveryProps {
  asset: string;
  issuer: string;
  onCreateTrustline: () => void | Promise<void>;
  onDismiss?: () => void;
  isCreating?: boolean;
}

export function TrustlineErrorRecovery({
  asset,
  issuer,
  onCreateTrustline,
  onDismiss,
  isCreating = false,
}: TrustlineErrorRecoveryProps) {
  return (
    <Card className="border-blue-500/50 bg-blue-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          <div>
            <CardTitle className="text-base">Trustline Required</CardTitle>
            <CardDescription>
              You need to establish a trustline to receive {asset}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertTitle className="text-sm">What is a trustline?</AlertTitle>
          <AlertDescription className="text-xs space-y-2">
            <p>
              A trustline is a Stellar blockchain feature that allows your wallet to hold specific
              assets. It's a one-time setup that indicates you trust the asset issuer.
            </p>
            <p className="font-medium">
              This is required before you can receive {asset} tokens.
            </p>
          </AlertDescription>
        </Alert>

        <div className="p-3 rounded-lg bg-muted text-xs space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Asset:</span>
            <span className="font-mono">{asset}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Issuer:</span>
            <span className="font-mono text-[10px]">{issuer.slice(0, 8)}...{issuer.slice(-8)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            onClick={onCreateTrustline}
            disabled={isCreating}
            size="sm"
            className="flex-1"
          >
            <Shield className={cn('h-4 w-4 mr-2', isCreating && 'animate-pulse')} />
            {isCreating ? 'Creating Trustline...' : 'Create Trustline'}
          </Button>
          
          {onDismiss && (
            <Button
              variant="outline"
              onClick={onDismiss}
              disabled={isCreating}
              size="sm"
            >
              Cancel
            </Button>
          )}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Creating a trustline requires a small network fee (≈0.00001 XLM)
        </p>
      </CardContent>
    </Card>
  );
}

/**
 * Anchor unavailable fallback component
 */
export interface AnchorUnavailableFallbackProps {
  anchorName: string;
  alternativeAnchors?: Array<{ id: string; name: string }>;
  onSelectAlternative?: (anchorId: string) => void;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function AnchorUnavailableFallback({
  anchorName,
  alternativeAnchors = [],
  onSelectAlternative,
  onRetry,
  onDismiss,
}: AnchorUnavailableFallbackProps) {
  return (
    <Card className="border-yellow-500/50 bg-yellow-500/5">
      <CardHeader>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <div>
            <CardTitle className="text-base">Anchor Service Unavailable</CardTitle>
            <CardDescription>
              {anchorName} is currently unavailable
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            The anchor service might be undergoing maintenance or experiencing technical difficulties.
            You can try again later or use an alternative anchor.
          </AlertDescription>
        </Alert>

        {alternativeAnchors.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Alternative Anchors:</p>
            <div className="space-y-2">
              {alternativeAnchors.map((anchor) => (
                <Button
                  key={anchor.id}
                  variant="outline"
                  size="sm"
                  className="w-full justify-between"
                  onClick={() => onSelectAlternative?.(anchor.id)}
                >
                  <span>{anchor.name}</span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="outline" size="sm" className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {onDismiss && (
            <Button variant="ghost" onClick={onDismiss} size="sm">
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Error dialog for modal display
 */
export interface ErrorDialogProps {
  open: boolean;
  error: Error | StellarError | null;
  onClose: () => void;
  onRetry?: () => void | Promise<void>;
  onRecovery?: () => void;
  title?: string;
}

export function ErrorDialog({
  open,
  error,
  onClose,
  onRetry,
  onRecovery,
  title = 'Error',
}: ErrorDialogProps) {
  if (!error) return null;

  const errorType = classifyError(error);
  const userMessage = error instanceof StellarError 
    ? handleStellarError(error)
    : {
        title: 'Error',
        message: error.message,
        severity: 'error' as const,
      };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {userMessage.message}
          </DialogDescription>
        </DialogHeader>

        {userMessage.action && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {userMessage.action}
            </AlertDescription>
          </Alert>
        )}

        <DialogFooter className="flex-col sm:flex-row gap-2">
          {onRetry && (
            <Button onClick={onRetry} variant="default">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          
          {onRecovery && (
            <Button onClick={onRecovery} variant="outline">
              Fix Issue
            </Button>
          )}
          
          <Button onClick={onClose} variant="ghost">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Error boundary fallback component
 */
export interface ErrorBoundaryFallbackProps {
  error: Error;
  resetError: () => void;
}

export function ErrorBoundaryFallback({ error, resetError }: ErrorBoundaryFallbackProps) {
  return (
    <div className="min-h-[400px] flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <XCircle className="h-6 w-6 text-destructive" />
            <CardTitle>Something went wrong</CardTitle>
          </div>
          <CardDescription>
            An unexpected error occurred. Please try refreshing the page.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 rounded-lg bg-muted text-xs font-mono break-all">
            {error.message}
          </div>

          <div className="flex gap-2">
            <Button onClick={resetError} className="flex-1">
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Reload Page
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
