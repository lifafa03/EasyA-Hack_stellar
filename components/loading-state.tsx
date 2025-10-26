'use client';

/**
 * Loading State Components
 * Provides consistent loading indicators for async operations
 */

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { Loader2, Wallet, TrendingUp, FileText, Clock } from 'lucide-react';

/**
 * Loading spinner component
 */
export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  message?: string;
}

export function LoadingSpinner({ size = 'md', className, message }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2 className={cn(sizeClasses[size], 'animate-spin text-primary')} />
      {message && (
        <p className="text-sm text-muted-foreground animate-pulse">{message}</p>
      )}
    </div>
  );
}

/**
 * Full page loading component
 */
export interface PageLoadingProps {
  message?: string;
  className?: string;
}

export function PageLoading({ message = 'Loading...', className }: PageLoadingProps) {
  return (
    <div className={cn('min-h-screen flex items-center justify-center', className)}>
      <LoadingSpinner size="lg" message={message} />
    </div>
  );
}

/**
 * Card loading skeleton
 */
export function CardLoadingSkeleton({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader>
            <Skeleton className="h-6 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
            <div className="flex gap-2 mt-4">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-24" />
            </div>
          </CardContent>
        </Card>
      ))}
    </>
  );
}

/**
 * Transaction loading component with progress
 */
export interface TransactionLoadingProps {
  message?: string;
  step?: string;
  progress?: number;
  estimatedTime?: string;
  className?: string;
}

export function TransactionLoading({
  message = 'Processing transaction...',
  step,
  progress,
  estimatedTime = '5-7 seconds',
  className,
}: TransactionLoadingProps) {
  return (
    <Card className={cn('border-primary/50 bg-primary/5', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <div className="flex-1">
            <CardTitle className="text-base">{message}</CardTitle>
            {step && (
              <CardDescription className="mt-1">{step}</CardDescription>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {progress !== undefined && (
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-muted-foreground text-right">{progress}%</p>
          </div>
        )}
        
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>Estimated time: {estimatedTime}</span>
        </div>

        <div className="p-3 rounded-lg bg-muted text-xs space-y-1">
          <p className="font-medium">Transaction Steps:</p>
          <ul className="list-disc list-inside space-y-1 text-muted-foreground">
            <li>Preparing transaction</li>
            <li>Signing with wallet</li>
            <li>Submitting to Stellar network</li>
            <li>Confirming on blockchain</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Wallet operation loading component
 */
export interface WalletOperationLoadingProps {
  operation: 'connecting' | 'signing' | 'submitting' | 'confirming';
  walletType?: string;
  className?: string;
}

export function WalletOperationLoading({
  operation,
  walletType,
  className,
}: WalletOperationLoadingProps) {
  const messages = {
    connecting: 'Connecting to wallet...',
    signing: 'Waiting for signature...',
    submitting: 'Submitting transaction...',
    confirming: 'Confirming transaction...',
  };

  const descriptions = {
    connecting: walletType 
      ? `Opening ${walletType} wallet connection`
      : 'Please approve the connection in your wallet',
    signing: 'Please review and sign the transaction in your wallet',
    submitting: 'Broadcasting transaction to the Stellar network',
    confirming: 'Waiting for blockchain confirmation',
  };

  return (
    <Card className={cn('border-blue-500/50 bg-blue-500/5', className)}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-blue-500 animate-pulse" />
          <div>
            <CardTitle className="text-base">{messages[operation]}</CardTitle>
            <CardDescription>{descriptions[operation]}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
          <div className="flex-1">
            <Progress value={33} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Data fetching loading component
 */
export interface DataLoadingProps {
  type: 'projects' | 'bids' | 'transactions' | 'balance';
  count?: number;
  className?: string;
}

export function DataLoading({ type, count = 3, className }: DataLoadingProps) {
  const icons = {
    projects: FileText,
    bids: TrendingUp,
    transactions: Clock,
    balance: Wallet,
  };

  const messages = {
    projects: 'Loading projects...',
    bids: 'Loading bids...',
    transactions: 'Loading transactions...',
    balance: 'Fetching balance...',
  };

  const Icon = icons[type];

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Icon className="h-4 w-4 animate-pulse" />
        <span>{messages[type]}</span>
      </div>
      <CardLoadingSkeleton count={count} />
    </div>
  );
}

/**
 * Inline loading component for buttons
 */
export interface InlineLoadingProps {
  message?: string;
  className?: string;
}

export function InlineLoading({ message, className }: InlineLoadingProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Loader2 className="h-4 w-4 animate-spin" />
      {message && <span className="text-sm">{message}</span>}
    </div>
  );
}

/**
 * Overlay loading component
 */
export interface OverlayLoadingProps {
  message?: string;
  show: boolean;
  className?: string;
}

export function OverlayLoading({ message, show, className }: OverlayLoadingProps) {
  if (!show) return null;

  return (
    <div className={cn(
      'fixed inset-0 z-50 bg-background/80 backdrop-blur-sm',
      'flex items-center justify-center',
      className
    )}>
      <Card className="border-primary/50 bg-background">
        <CardContent className="pt-6">
          <LoadingSpinner size="lg" message={message} />
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Hook for managing loading states
 */
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = React.useState(initialState);
  const [loadingMessage, setLoadingMessage] = React.useState<string | undefined>();

  const startLoading = React.useCallback((message?: string) => {
    setIsLoading(true);
    setLoadingMessage(message);
  }, []);

  const stopLoading = React.useCallback(() => {
    setIsLoading(false);
    setLoadingMessage(undefined);
  }, []);

  const withLoading = React.useCallback(
    async <T,>(fn: () => Promise<T>, message?: string): Promise<T> => {
      startLoading(message);
      try {
        return await fn();
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading]
  );

  return {
    isLoading,
    loadingMessage,
    startLoading,
    stopLoading,
    withLoading,
  };
}

/**
 * Async operation wrapper component
 */
export interface AsyncOperationProps {
  isLoading: boolean;
  loadingMessage?: string;
  loadingComponent?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function AsyncOperation({
  isLoading,
  loadingMessage,
  loadingComponent,
  children,
  className,
}: AsyncOperationProps) {
  if (isLoading) {
    return (
      <div className={className}>
        {loadingComponent || <LoadingSpinner message={loadingMessage} />}
      </div>
    );
  }

  return <>{children}</>;
}
