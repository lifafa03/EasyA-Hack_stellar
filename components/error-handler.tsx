'use client';

/**
 * Centralized Error Handler Component
 * Provides comprehensive error handling with user-friendly messages,
 * recovery actions, and wallet connection prompts
 */

import * as React from 'react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  AlertCircle, 
  AlertTriangle,
  RefreshCw, 
  Wallet,
  Info,
  XCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { 
  handleStellarError, 
  type UserFriendlyMessage,
  isNetworkError,
  isInsufficientFundsError,
  isUserRejectedError,
  ErrorCode
} from '@/lib/stellar/errors';
import { StellarError } from '@/lib/stellar/types';
import { useWallet } from '@/hooks/use-wallet';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Error type classification
 */
export type ErrorType = 
  | 'network'
  | 'insufficient_funds'
  | 'wallet_not_connected'
  | 'wallet_error'
  | 'transaction_failed'
  | 'validation'
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
  context?: string;
}

/**
 * Classify error type
 */
function classifyError(error: Error | StellarError): ErrorType {
  if (isNetworkError(error)) return 'network';
  if (isInsufficientFundsError(error)) return 'insufficient_funds';
  if (isUserRejectedError(error)) return 'wallet_error';
  
  if (error instanceof StellarError) {
    switch (error.code) {
      case ErrorCode.WALLET_ERROR:
        return 'wallet_error';
      case ErrorCode.UNAUTHORIZED:
        return 'wallet_not_connected';
      case ErrorCode.INVALID_PARAMS:
        return 'validation';
      case ErrorCode.TRANSACTION_FAILED:
        return 'transaction_failed';
      case ErrorCode.INSUFFICIENT_FUNDS:
        return 'insufficient_funds';
      default:
        return 'unknown';
    }
  }
  
  // Check error message for specific patterns
  const message = error.message.toLowerCase();
  if (message.includes('not connected') || message.includes('no wallet')) {
    return 'wallet_not_connected';
  }
  if (message.includes('network') || message.includes('timeout')) {
    return 'network';
  }
  if (message.includes('insufficient') || message.includes('balance')) {
    return 'insufficient_funds';
  }
  if (message.includes('rejected') || message.includes('declined')) {
    return 'wallet_error';
  }
  
  return 'unknown';
}

/**
 * Get error severity
 */
function getErrorSeverity(errorType: ErrorType): 'error' | 'warning' | 'info' {
  switch (errorType) {
    case 'network':
      return 'warning';
    case 'wallet_error':
      return 'info';
    case 'insufficient_funds':
    case 'wallet_not_connected':
    case 'transaction_failed':
    case 'validation':
    case 'unknown':
      return 'error';
  }
}

/**
 * Main centralized error handler component
 */
export function ErrorHandler({
  error,
  onRetry,
  onDismiss,
  onRecovery,
  className,
  showDetails = false,
  context,
}: ErrorHandlerProps) {
  const [showDetailsExpanded, setShowDetailsExpanded] = React.useState(false);
  const wallet = useWallet();
  const router = useRouter();
  
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

  // Handle wallet not connected error with special UI
  if (errorType === 'wallet_not_connected' && !wallet.connected) {
    return (
      <WalletConnectionPrompt
        onConnect={() => wallet.connect()}
        onDismiss={onDismiss}
        context={context}
        className={className}
      />
    );
  }

  // Handle insufficient funds with special UI
  if (errorType === 'insufficient_funds') {
    return (
      <InsufficientFundsPrompt
        currentBalance={wallet.usdcBalance || '0'}
        onAddFunds={() => router.push('/profile?tab=deposit')}
        onDismiss={onDismiss}
        className={className}
      />
    );
  }

  return (
    <Alert variant={severity === 'error' ? 'destructive' : 'default'} className={className}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{userMessage.title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p>{userMessage.message}</p>
        
        {userMessage.action && (
          <p className="text-sm font-medium">{userMessage.action}</p>
        )}

        {context && (
          <p className="text-xs text-muted-foreground">Context: {context}</p>
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
                {error.stack && (
                  <details className="mt-2">
                    <summary className="cursor-pointer">Stack Trace</summary>
                    <pre className="mt-1 text-[10px] overflow-auto">{error.stack}</pre>
                  </details>
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
 * Wallet connection prompt component
 */
interface WalletConnectionPromptProps {
  onConnect: () => void | Promise<void>;
  onDismiss?: () => void;
  context?: string;
  className?: string;
}

export function WalletConnectionPrompt({
  onConnect,
  onDismiss,
  context,
  className,
}: WalletConnectionPromptProps) {
  const [isConnecting, setIsConnecting] = React.useState(false);

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await onConnect();
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Card className={cn('border-blue-500/50 bg-blue-500/5', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-500" />
          <div>
            <CardTitle className="text-base">Wallet Not Connected</CardTitle>
            <CardDescription>
              {context 
                ? `Connect your wallet to ${context}`
                : 'Please connect your wallet to continue'}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            You need to connect a Stellar wallet to perform this action. 
            Your wallet will be used to sign transactions securely.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button
            onClick={handleConnect}
            disabled={isConnecting}
            size="sm"
            className="flex-1"
          >
            <Wallet className={cn('h-4 w-4 mr-2', isConnecting && 'animate-pulse')} />
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
          </Button>
          
          {onDismiss && (
            <Button
              variant="outline"
              onClick={onDismiss}
              disabled={isConnecting}
              size="sm"
            >
              Cancel
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Insufficient funds prompt component
 */
interface InsufficientFundsPromptProps {
  currentBalance: string;
  requiredAmount?: string;
  onAddFunds: () => void;
  onDismiss?: () => void;
  className?: string;
}

export function InsufficientFundsPrompt({
  currentBalance,
  requiredAmount,
  onAddFunds,
  onDismiss,
  className,
}: InsufficientFundsPromptProps) {
  const shortfall = requiredAmount 
    ? (parseFloat(requiredAmount) - parseFloat(currentBalance)).toFixed(2)
    : null;

  return (
    <Card className={cn('border-red-500/50 bg-red-500/5', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <XCircle className="h-5 w-5 text-red-500" />
          <div>
            <CardTitle className="text-base">Insufficient USDC Balance</CardTitle>
            <CardDescription>
              You don't have enough USDC to complete this transaction
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Current Balance</p>
            <p className="text-sm font-bold">${parseFloat(currentBalance).toFixed(2)} USDC</p>
          </div>
          {shortfall && (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Needed</p>
              <p className="text-sm font-bold text-red-500">${shortfall} USDC</p>
            </div>
          )}
        </div>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Add USDC to your wallet via the Profile page to continue.
          </AlertDescription>
        </Alert>

        <div className="flex gap-2">
          <Button onClick={onAddFunds} size="sm" className="flex-1">
            <ExternalLink className="h-4 w-4 mr-2" />
            Add USDC
          </Button>
          
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
 * Error dialog for modal display
 */
export interface ErrorDialogProps {
  open: boolean;
  error: Error | StellarError | null;
  onClose: () => void;
  onRetry?: () => void | Promise<void>;
  onRecovery?: () => void;
  title?: string;
  context?: string;
}

export function ErrorDialog({
  open,
  error,
  onClose,
  onRetry,
  onRecovery,
  title = 'Error',
  context,
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

        {context && (
          <p className="text-xs text-muted-foreground">Context: {context}</p>
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
 * Hook for using error handler imperatively
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | StellarError | null>(null);
  const [isOpen, setIsOpen] = React.useState(false);

  const showError = React.useCallback((err: Error | StellarError, context?: string) => {
    setError(err);
    setIsOpen(true);
    
    // Also show toast for quick feedback
    const userMessage = err instanceof StellarError 
      ? handleStellarError(err)
      : { title: 'Error', message: err.message, severity: 'error' as const };
    
    toast.error(userMessage.title, {
      description: userMessage.message,
    });
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
    setIsOpen(false);
  }, []);

  return {
    error,
    isOpen,
    showError,
    clearError,
  };
}
