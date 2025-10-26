'use client';

/**
 * Async Operation Wrapper
 * Combines error handling, loading states, and transaction progress
 * for seamless async operation management
 */

import * as React from 'react';
import { ErrorHandler, useErrorHandler } from './error-handler';
import { LoadingSpinner, TransactionLoading } from './loading-state';
import { TransactionProgress, useTransactionProgress, DEFAULT_TRANSACTION_STEPS } from './transaction-progress';
import { StellarError } from '@/lib/stellar/types';
import { cn } from '@/lib/utils';

/**
 * Operation state
 */
export type OperationState = 'idle' | 'loading' | 'transaction' | 'success' | 'error';

/**
 * Async operation wrapper props
 */
export interface AsyncOperationWrapperProps {
  children: React.ReactNode;
  isLoading?: boolean;
  isTransaction?: boolean;
  error?: Error | StellarError | null;
  loadingMessage?: string;
  transactionHash?: string;
  explorerUrl?: string;
  onRetry?: () => void | Promise<void>;
  onSuccess?: () => void;
  showTransactionProgress?: boolean;
  className?: string;
}

/**
 * Async operation wrapper component
 */
export function AsyncOperationWrapper({
  children,
  isLoading = false,
  isTransaction = false,
  error = null,
  loadingMessage,
  transactionHash,
  explorerUrl,
  onRetry,
  onSuccess,
  showTransactionProgress = true,
  className,
}: AsyncOperationWrapperProps) {
  const transactionProgress = useTransactionProgress();

  // Update transaction progress based on loading state
  React.useEffect(() => {
    if (isTransaction && isLoading) {
      if (!transactionProgress.currentStep) {
        transactionProgress.startStep('prepare');
      }
    }
  }, [isTransaction, isLoading, transactionProgress]);

  // Update transaction hash
  React.useEffect(() => {
    if (transactionHash) {
      transactionProgress.setHash(transactionHash);
      transactionProgress.completeStep('submit');
      transactionProgress.startStep('confirm');
    }
  }, [transactionHash, transactionProgress]);

  // Handle error state
  if (error) {
    return (
      <div className={className}>
        <ErrorHandler
          error={error}
          onRetry={onRetry}
          onDismiss={() => {
            // Error dismissed
          }}
          showDetails={process.env.NODE_ENV === 'development'}
        />
      </div>
    );
  }

  // Handle loading state
  if (isLoading) {
    if (isTransaction && showTransactionProgress) {
      return (
        <div className={className}>
          <TransactionProgress
            steps={transactionProgress.steps}
            currentStep={transactionProgress.currentStep}
            transactionHash={transactionProgress.transactionHash}
            explorerUrl={explorerUrl}
          />
        </div>
      );
    }

    return (
      <div className={className}>
        {isTransaction ? (
          <TransactionLoading message={loadingMessage} />
        ) : (
          <LoadingSpinner message={loadingMessage} />
        )}
      </div>
    );
  }

  // Render children when not loading and no error
  return <div className={className}>{children}</div>;
}

/**
 * Hook for managing async operations with integrated error handling and loading
 */
export interface UseAsyncOperationOptions {
  onSuccess?: () => void;
  onError?: (error: Error | StellarError) => void;
  isTransaction?: boolean;
  loadingMessage?: string;
}

export function useAsyncOperation<T = any>(options: UseAsyncOperationOptions = {}) {
  const [state, setState] = React.useState<OperationState>('idle');
  const [data, setData] = React.useState<T | null>(null);
  const [error, setError] = React.useState<Error | StellarError | null>(null);
  const [transactionHash, setTransactionHash] = React.useState<string | undefined>();
  const errorHandler = useErrorHandler();

  const execute = React.useCallback(
    async (fn: () => Promise<T>) => {
      setState('loading');
      setError(null);
      setData(null);
      setTransactionHash(undefined);

      try {
        const result = await fn();
        setData(result);
        setState('success');
        
        if (options.onSuccess) {
          options.onSuccess();
        }

        return result;
      } catch (err) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        setState('error');
        
        if (options.onError) {
          options.onError(error);
        } else {
          errorHandler.showError(error);
        }

        throw error;
      }
    },
    [options, errorHandler]
  );

  const reset = React.useCallback(() => {
    setState('idle');
    setError(null);
    setData(null);
    setTransactionHash(undefined);
  }, []);

  const retry = React.useCallback(
    async (fn: () => Promise<T>) => {
      return execute(fn);
    },
    [execute]
  );

  return {
    state,
    data,
    error,
    transactionHash,
    isLoading: state === 'loading',
    isSuccess: state === 'success',
    isError: state === 'error',
    isIdle: state === 'idle',
    execute,
    reset,
    retry,
    setTransactionHash,
  };
}

/**
 * Async button component with integrated loading and error handling
 */
export interface AsyncButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  onClick: () => Promise<void>;
  loadingMessage?: string;
  successMessage?: string;
  errorMessage?: string;
  isTransaction?: boolean;
  children: React.ReactNode;
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export function AsyncButton({
  onClick,
  loadingMessage,
  successMessage,
  errorMessage,
  isTransaction = false,
  children,
  className,
  disabled,
  ...props
}: AsyncButtonProps) {
  const operation = useAsyncOperation({ isTransaction });
  const [showSuccess, setShowSuccess] = React.useState(false);

  const handleClick = async () => {
    try {
      await operation.execute(onClick);
      
      if (successMessage) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 2000);
      }
    } catch (error) {
      // Error is handled by useAsyncOperation
    }
  };

  return (
    <>
      <button
        onClick={handleClick}
        disabled={disabled || operation.isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          operation.isLoading && 'opacity-50 cursor-not-allowed',
          className
        )}
        {...props}
      >
        {operation.isLoading ? (
          <>
            <LoadingSpinner size="sm" />
            {loadingMessage || 'Loading...'}
          </>
        ) : showSuccess ? (
          <>
            <span>✓</span>
            {successMessage || 'Success!'}
          </>
        ) : (
          children
        )}
      </button>

      {operation.error && errorMessage && (
        <ErrorHandler
          error={operation.error}
          onRetry={handleClick}
          className="mt-2"
        />
      )}
    </>
  );
}

/**
 * Async form wrapper with integrated error handling
 */
export interface AsyncFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  onSubmit: (e: React.FormEvent) => Promise<void>;
  loadingMessage?: string;
  isTransaction?: boolean;
  children: React.ReactNode;
}

export function AsyncForm({
  onSubmit,
  loadingMessage,
  isTransaction = false,
  children,
  className,
  ...props
}: AsyncFormProps) {
  const operation = useAsyncOperation({ isTransaction });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await operation.execute(async () => {
        await onSubmit(e);
      });
    } catch (error) {
      // Error is handled by useAsyncOperation
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className} {...props}>
      <AsyncOperationWrapper
        isLoading={operation.isLoading}
        isTransaction={isTransaction}
        error={operation.error}
        loadingMessage={loadingMessage}
        onRetry={() => handleSubmit(new Event('submit') as any)}
      >
        {children}
      </AsyncOperationWrapper>
    </form>
  );
}

/**
 * Async data fetcher component
 */
export interface AsyncDataFetcherProps<T> {
  fetchFn: () => Promise<T>;
  children: (data: T) => React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: (error: Error, retry: () => void) => React.ReactNode;
  deps?: React.DependencyList;
}

export function AsyncDataFetcher<T>({
  fetchFn,
  children,
  loadingComponent,
  errorComponent,
  deps = [],
}: AsyncDataFetcherProps<T>) {
  const operation = useAsyncOperation<T>();

  React.useEffect(() => {
    operation.execute(fetchFn);
  }, deps);

  if (operation.isLoading) {
    return <>{loadingComponent || <LoadingSpinner message="Loading data..." />}</>;
  }

  if (operation.error) {
    if (errorComponent) {
      return <>{errorComponent(operation.error, () => operation.retry(fetchFn))}</>;
    }
    return (
      <ErrorHandler
        error={operation.error}
        onRetry={() => operation.retry(fetchFn)}
      />
    );
  }

  if (operation.data) {
    return <>{children(operation.data)}</>;
  }

  return null;
}
