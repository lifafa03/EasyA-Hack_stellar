# Error Handler Usage Guide

This document provides examples of how to integrate the error handler components into the fiat gateway flows.

## Overview

The error handler provides comprehensive error handling and recovery flows for:
- Network errors with automatic retry
- Insufficient funds with balance display
- Trustline errors with creation flow
- Anchor unavailability with alternatives
- General error display with user-friendly messages

## Components

### 1. ErrorHandler (Basic Error Display)

Use for inline error display with retry and recovery options:

```tsx
import { ErrorHandler } from '@/components/fiat-gateway';

function MyComponent() {
  const [error, setError] = useState<Error | null>(null);

  return (
    <ErrorHandler
      error={error}
      onRetry={async () => {
        setError(null);
        // Retry the operation
        await performOperation();
      }}
      onDismiss={() => setError(null)}
      showDetails={true}
    />
  );
}
```

### 2. NetworkErrorRecovery

Use for network-related errors with automatic retry logic:

```tsx
import { NetworkErrorRecovery } from '@/components/fiat-gateway';

function MyComponent() {
  const [showNetworkError, setShowNetworkError] = useState(false);

  return (
    <>
      {showNetworkError && (
        <NetworkErrorRecovery
          onRetry={async () => {
            await fetchData();
            setShowNetworkError(false);
          }}
          onDismiss={() => setShowNetworkError(false)}
          retryOptions={{
            maxRetries: 3,
            initialDelay: 1000,
            backoffMultiplier: 2,
          }}
        />
      )}
    </>
  );
}
```

### 3. InsufficientFundsRecovery

Use when user doesn't have enough balance:

```tsx
import { InsufficientFundsRecovery } from '@/components/fiat-gateway';

function MyComponent() {
  const [showInsufficientFunds, setShowInsufficientFunds] = useState(false);

  return (
    <>
      {showInsufficientFunds && (
        <InsufficientFundsRecovery
          requiredAmount="100.00"
          currentBalance="50.00"
          currency="USDC"
          onAddFunds={() => {
            // Navigate to on-ramp flow
            router.push('/fiat-gateway?tab=on-ramp');
          }}
          onDismiss={() => setShowInsufficientFunds(false)}
        />
      )}
    </>
  );
}
```

### 4. TrustlineErrorRecovery

Use when trustline creation is required:

```tsx
import { TrustlineErrorRecovery } from '@/components/fiat-gateway';

function MyComponent() {
  const [showTrustlineError, setShowTrustlineError] = useState(false);
  const [isCreatingTrustline, setIsCreatingTrustline] = useState(false);

  const handleCreateTrustline = async () => {
    setIsCreatingTrustline(true);
    try {
      await anchorService.createTrustline(
        wallet.publicKey,
        'USDC',
        issuer,
        signer
      );
      setShowTrustlineError(false);
      toast.success('Trustline created successfully!');
    } catch (error) {
      toast.error('Failed to create trustline');
    } finally {
      setIsCreatingTrustline(false);
    }
  };

  return (
    <>
      {showTrustlineError && (
        <TrustlineErrorRecovery
          asset="USDC"
          issuer="GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
          onCreateTrustline={handleCreateTrustline}
          onDismiss={() => setShowTrustlineError(false)}
          isCreating={isCreatingTrustline}
        />
      )}
    </>
  );
}
```

### 5. AnchorUnavailableFallback

Use when the selected anchor is unavailable:

```tsx
import { AnchorUnavailableFallback } from '@/components/fiat-gateway';

function MyComponent() {
  const [showAnchorError, setShowAnchorError] = useState(false);

  return (
    <>
      {showAnchorError && (
        <AnchorUnavailableFallback
          anchorName="MoneyGram Access"
          alternativeAnchors={[
            { id: 'anchorusd', name: 'AnchorUSD' },
            { id: 'vibrant', name: 'Vibrant' },
          ]}
          onSelectAlternative={(anchorId) => {
            setSelectedAnchor(anchorId);
            setShowAnchorError(false);
          }}
          onRetry={async () => {
            await checkAnchorAvailability();
          }}
          onDismiss={() => setShowAnchorError(false)}
        />
      )}
    </>
  );
}
```

### 6. ErrorDialog

Use for modal error display:

```tsx
import { ErrorDialog } from '@/components/fiat-gateway';

function MyComponent() {
  const [error, setError] = useState<Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  return (
    <ErrorDialog
      open={showErrorDialog}
      error={error}
      onClose={() => {
        setShowErrorDialog(false);
        setError(null);
      }}
      onRetry={async () => {
        await retryOperation();
        setShowErrorDialog(false);
      }}
      title="Transaction Error"
    />
  );
}
```

### 7. ErrorBoundaryFallback

Use with React Error Boundary:

```tsx
import { ErrorBoundary } from 'react-error-boundary';
import { ErrorBoundaryFallback } from '@/components/fiat-gateway';

function App() {
  return (
    <ErrorBoundary
      FallbackComponent={ErrorBoundaryFallback}
      onReset={() => {
        // Reset app state
        window.location.href = '/';
      }}
    >
      <YourApp />
    </ErrorBoundary>
  );
}
```

## Integration Examples

### Example 1: On-Ramp Flow with Error Handling

```tsx
import { useState } from 'react';
import { OnRampFlow, ErrorHandler, TrustlineErrorRecovery } from '@/components/fiat-gateway';
import { isInsufficientFundsError, isNetworkError } from '@/lib/stellar/errors';

function OnRampPage() {
  const [error, setError] = useState<Error | null>(null);
  const [showTrustlineError, setShowTrustlineError] = useState(false);

  const handleError = (error: Error) => {
    // Classify error and show appropriate recovery UI
    if (error.message.includes('trustline')) {
      setShowTrustlineError(true);
    } else {
      setError(error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Trustline error recovery */}
      {showTrustlineError && (
        <TrustlineErrorRecovery
          asset="USDC"
          issuer="GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
          onCreateTrustline={async () => {
            // Handle trustline creation
            await createTrustline();
            setShowTrustlineError(false);
          }}
          onDismiss={() => setShowTrustlineError(false)}
        />
      )}

      {/* General error display */}
      {error && (
        <ErrorHandler
          error={error}
          onRetry={async () => {
            setError(null);
            // Retry the operation
          }}
          onDismiss={() => setError(null)}
          showDetails={true}
        />
      )}

      {/* On-ramp flow */}
      <OnRampFlow
        selectedAnchor={selectedAnchor}
        onError={handleError}
        onComplete={(txId) => {
          console.log('Transaction completed:', txId);
        }}
      />
    </div>
  );
}
```

### Example 2: Centralized Error Handler

```tsx
import { useState, useCallback } from 'react';
import {
  ErrorHandler,
  NetworkErrorRecovery,
  InsufficientFundsRecovery,
  TrustlineErrorRecovery,
  AnchorUnavailableFallback,
  type ErrorType,
} from '@/components/fiat-gateway';

function FiatGatewayPage() {
  const [error, setError] = useState<Error | null>(null);
  const [errorType, setErrorType] = useState<ErrorType | null>(null);

  const handleError = useCallback((error: Error, type: ErrorType) => {
    setError(error);
    setErrorType(type);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
    setErrorType(null);
  }, []);

  const renderErrorRecovery = () => {
    if (!error || !errorType) return null;

    switch (errorType) {
      case 'network':
        return (
          <NetworkErrorRecovery
            onRetry={async () => {
              // Retry operation
              clearError();
            }}
            onDismiss={clearError}
          />
        );

      case 'insufficient_funds':
        return (
          <InsufficientFundsRecovery
            requiredAmount="100.00"
            currentBalance="50.00"
            currency="USDC"
            onAddFunds={() => {
              // Navigate to add funds
              clearError();
            }}
            onDismiss={clearError}
          />
        );

      case 'trustline':
        return (
          <TrustlineErrorRecovery
            asset="USDC"
            issuer="GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN"
            onCreateTrustline={async () => {
              // Create trustline
              clearError();
            }}
            onDismiss={clearError}
          />
        );

      case 'anchor_unavailable':
        return (
          <AnchorUnavailableFallback
            anchorName="MoneyGram Access"
            alternativeAnchors={[
              { id: 'anchorusd', name: 'AnchorUSD' },
            ]}
            onSelectAlternative={(id) => {
              // Switch anchor
              clearError();
            }}
            onRetry={async () => {
              // Retry with same anchor
              clearError();
            }}
            onDismiss={clearError}
          />
        );

      default:
        return (
          <ErrorHandler
            error={error}
            onRetry={async () => {
              // Generic retry
              clearError();
            }}
            onDismiss={clearError}
            showDetails={true}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {renderErrorRecovery()}
      
      {/* Your main content */}
    </div>
  );
}
```

## Best Practices

1. **Always classify errors**: Use the error classification utilities to determine the appropriate recovery UI
2. **Provide clear actions**: Always give users a clear path to resolve the error
3. **Use exponential backoff**: For network errors, use the built-in retry logic with exponential backoff
4. **Show progress**: Display retry attempts and progress to keep users informed
5. **Handle edge cases**: Consider offline scenarios, timeout errors, and anchor unavailability
6. **Log errors**: All errors are automatically logged for debugging
7. **User-friendly messages**: The error handler automatically converts technical errors to user-friendly messages

## Error Classification

The error handler automatically classifies errors into these types:

- `network`: Connection issues, timeouts
- `insufficient_funds`: Not enough balance
- `trustline`: Missing trustline
- `anchor_unavailable`: Anchor service down
- `wallet`: Wallet connection issues
- `validation`: Invalid input
- `timeout`: Operation timeout
- `unknown`: Unclassified errors

## Retry Logic

The `NetworkErrorRecovery` component uses exponential backoff:

```typescript
{
  maxRetries: 3,           // Maximum retry attempts
  initialDelay: 1000,      // Initial delay (1 second)
  maxDelay: 30000,         // Maximum delay (30 seconds)
  backoffMultiplier: 2,    // Delay multiplier (doubles each time)
}
```

Retry delays: 1s → 2s → 4s → 8s → ...

## Testing

Test error scenarios:

```tsx
// Simulate network error
throw new StellarError('Network timeout', ErrorCode.NETWORK_ERROR);

// Simulate insufficient funds
throw new StellarError('Insufficient balance', ErrorCode.INSUFFICIENT_FUNDS);

// Simulate trustline error
throw new Error('Trustline does not exist for asset USDC');

// Simulate anchor error
throw new StellarError('Anchor unavailable', ErrorCode.ANCHOR_ERROR);
```
