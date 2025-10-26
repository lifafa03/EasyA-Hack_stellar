'use client';

/**
 * Retry UI components for failed transactions
 * Provides user interface for retrying failed operations
 */

import React, { useState, useEffect } from 'react';
import {
  getTransactionQueue,
  QueuedTransaction,
  calculateRetryDelay,
} from '@/lib/stellar/retry';
import { handleStellarError } from '@/lib/stellar/errors';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, AlertCircle, CheckCircle, Clock, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Retry button component
 */
interface RetryButtonProps {
  onRetry: () => Promise<void>;
  disabled?: boolean;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function RetryButton({
  onRetry,
  disabled = false,
  className,
  size = 'default',
}: RetryButtonProps) {
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  return (
    <Button
      onClick={handleRetry}
      disabled={disabled || isRetrying}
      variant="outline"
      size={size}
      className={className}
    >
      <RefreshCw className={cn('h-4 w-4', size !== 'icon' && 'mr-2', isRetrying && 'animate-spin')} />
      {size !== 'icon' && (isRetrying ? 'Retrying...' : 'Retry')}
    </Button>
  );
}

/**
 * Transaction status badge
 */
function TransactionStatusBadge({ status }: { status: QueuedTransaction['status'] }) {
  const variants: Record<QueuedTransaction['status'], { variant: any; icon: React.ReactNode; label: string }> = {
    pending: {
      variant: 'secondary',
      icon: <Clock className="h-3 w-3 mr-1" />,
      label: 'Pending',
    },
    processing: {
      variant: 'default',
      icon: <RefreshCw className="h-3 w-3 mr-1 animate-spin" />,
      label: 'Processing',
    },
    completed: {
      variant: 'default',
      icon: <CheckCircle className="h-3 w-3 mr-1" />,
      label: 'Completed',
    },
    failed: {
      variant: 'destructive',
      icon: <AlertCircle className="h-3 w-3 mr-1" />,
      label: 'Failed',
    },
  };

  const config = variants[status];

  return (
    <Badge variant={config.variant} className="flex items-center w-fit">
      {config.icon}
      {config.label}
    </Badge>
  );
}

/**
 * Single transaction item
 */
interface TransactionItemProps {
  transaction: QueuedTransaction;
  onRetry: (id: string) => void;
  onRemove: (id: string) => void;
}

function TransactionItem({ transaction, onRetry, onRemove }: TransactionItemProps) {
  const errorMessage = transaction.error
    ? handleStellarError(transaction.error as any)
    : null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-sm font-medium">
              Transaction {transaction.id.slice(0, 8)}...
            </CardTitle>
            <CardDescription className="text-xs">
              Created {transaction.createdAt.toLocaleString()}
            </CardDescription>
          </div>
          <TransactionStatusBadge status={transaction.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {transaction.attempts > 0 && (
          <div className="text-xs text-muted-foreground">
            Attempts: {transaction.attempts}
            {transaction.lastAttemptAt && (
              <> • Last attempt: {transaction.lastAttemptAt.toLocaleString()}</>
            )}
          </div>
        )}

        {errorMessage && transaction.status === 'failed' && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              <div className="font-medium">{errorMessage.title}</div>
              <div className="mt-1">{errorMessage.message}</div>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2">
          {transaction.status === 'failed' && (
            <RetryButton
              onRetry={() => onRetry(transaction.id)}
              size="sm"
            />
          )}
          {(transaction.status === 'failed' || transaction.status === 'completed') && (
            <Button
              onClick={() => onRemove(transaction.id)}
              variant="ghost"
              size="sm"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Transaction queue viewer
 */
export function TransactionQueueViewer() {
  const [transactions, setTransactions] = useState<QueuedTransaction[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const queue = getTransactionQueue();

  useEffect(() => {
    // Initial load
    setTransactions(queue.getAllTransactions());
    setIsOnline(queue.getOnlineStatus());

    // Poll for updates
    const interval = setInterval(() => {
      setTransactions(queue.getAllTransactions());
      setIsOnline(queue.getOnlineStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleRetry = async (id: string) => {
    await queue.retry(id);
    setTransactions(queue.getAllTransactions());
  };

  const handleRetryAll = async () => {
    await queue.retryAll();
    setTransactions(queue.getAllTransactions());
  };

  const handleRemove = (id: string) => {
    queue.dequeue(id);
    setTransactions(queue.getAllTransactions());
  };

  const handleClearCompleted = () => {
    queue.clearCompleted();
    setTransactions(queue.getAllTransactions());
  };

  const failedCount = transactions.filter(tx => tx.status === 'failed').length;
  const pendingCount = transactions.filter(tx => tx.status === 'pending').length;
  const completedCount = transactions.filter(tx => tx.status === 'completed').length;

  if (transactions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Transaction Queue</CardTitle>
              <CardDescription>
                {pendingCount} pending • {failedCount} failed • {completedCount} completed
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={isOnline ? 'default' : 'destructive'}>
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {!isOnline && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                You are currently offline. Transactions will be processed when connection is restored.
              </AlertDescription>
            </Alert>
          )}

          {failedCount > 0 && (
            <div className="flex gap-2">
              <Button onClick={handleRetryAll} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Retry All Failed
              </Button>
            </div>
          )}

          {completedCount > 0 && (
            <Button onClick={handleClearCompleted} variant="ghost" size="sm">
              <Trash2 className="h-4 w-4 mr-2" />
              Clear Completed
            </Button>
          )}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {transactions.map(transaction => (
          <TransactionItem
            key={transaction.id}
            transaction={transaction}
            onRetry={handleRetry}
            onRemove={handleRemove}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Inline retry component for individual operations
 */
interface InlineRetryProps {
  error: Error;
  onRetry: () => Promise<void>;
  maxRetries?: number;
  currentAttempt?: number;
}

export function InlineRetry({
  error,
  onRetry,
  maxRetries = 3,
  currentAttempt = 0,
}: InlineRetryProps) {
  const [isRetrying, setIsRetrying] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const errorMessage = handleStellarError(error as any);
  const canRetry = currentAttempt < maxRetries;
  const nextDelay = calculateRetryDelay(currentAttempt);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleRetry = async () => {
    setIsRetrying(true);
    try {
      await onRetry();
    } finally {
      setIsRetrying(false);
    }
  };

  const handleAutoRetry = () => {
    setCountdown(Math.ceil(nextDelay / 1000));
    setTimeout(handleRetry, nextDelay);
  };

  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-3">
          <div>
            <div className="font-medium">{errorMessage.title}</div>
            <div className="text-sm mt-1">{errorMessage.message}</div>
            {errorMessage.action && (
              <div className="text-sm mt-1 font-medium">{errorMessage.action}</div>
            )}
          </div>

          {canRetry && (
            <div className="flex items-center gap-2">
              <RetryButton
                onRetry={handleRetry}
                disabled={isRetrying || countdown !== null}
                size="sm"
              />
              {countdown === null && (
                <Button
                  onClick={handleAutoRetry}
                  variant="ghost"
                  size="sm"
                  disabled={isRetrying}
                >
                  Auto-retry in {Math.ceil(nextDelay / 1000)}s
                </Button>
              )}
              {countdown !== null && (
                <span className="text-sm text-muted-foreground">
                  Retrying in {countdown}s...
                </span>
              )}
            </div>
          )}

          {!canRetry && (
            <div className="text-sm text-muted-foreground">
              Maximum retry attempts reached. Please try again later or contact support.
            </div>
          )}

          {currentAttempt > 0 && (
            <div className="text-xs text-muted-foreground">
              Attempt {currentAttempt} of {maxRetries}
            </div>
          )}
        </div>
      </AlertDescription>
    </Alert>
  );
}
