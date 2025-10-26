'use client';

/**
 * React Error Boundary for Stellar operations
 * Catches and handles errors in Stellar-related components
 */

import React, { Component, ReactNode } from 'react';
import { StellarError } from '@/lib/stellar/types';
import { handleStellarError, logError, UserFriendlyMessage } from '@/lib/stellar/errors';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorMessage: UserFriendlyMessage | null;
}

/**
 * Error boundary component for Stellar operations
 */
export class StellarErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorMessage: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI
    const errorMessage = error instanceof StellarError 
      ? handleStellarError(error)
      : {
          title: 'Unexpected Error',
          message: error.message || 'An unexpected error occurred',
          severity: 'error' as const,
        };

    return {
      hasError: true,
      error,
      errorMessage,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to error logger
    logError(error, {
      componentStack: errorInfo.componentStack,
      errorBoundary: 'StellarErrorBoundary',
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorMessage: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.handleReset);
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          errorMessage={this.state.errorMessage!}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default error fallback UI
 */
function DefaultErrorFallback({
  errorMessage,
  onReset,
}: {
  errorMessage: UserFriendlyMessage;
  onReset: () => void;
}) {
  const variant = errorMessage.severity === 'error' ? 'destructive' : 'default';

  return (
    <div className="flex items-center justify-center p-6">
      <Alert variant={variant} className="max-w-2xl">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>{errorMessage.title}</AlertTitle>
        <AlertDescription className="mt-2">
          <p>{errorMessage.message}</p>
          {errorMessage.action && (
            <p className="mt-2 text-sm font-medium">{errorMessage.action}</p>
          )}
          <Button
            onClick={onReset}
            variant="outline"
            size="sm"
            className="mt-4"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
}

/**
 * Hook to use error boundary imperatively
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return setError;
}

/**
 * Wrapper component for async operations with error handling
 */
interface AsyncErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error) => void;
  fallback?: ReactNode;
}

export function AsyncErrorBoundary({
  children,
  onError,
  fallback,
}: AsyncErrorBoundaryProps) {
  return (
    <StellarErrorBoundary
      onError={(error, errorInfo) => {
        if (onError) {
          onError(error);
        }
      }}
      fallback={
        fallback
          ? () => fallback
          : undefined
      }
    >
      {children}
    </StellarErrorBoundary>
  );
}
