# Error Handling and User Feedback System

Comprehensive error handling, loading states, and transaction progress indicators for the Stellar marketplace dApp.

## Overview

This system provides:
- **Centralized error handling** with user-friendly messages
- **Wallet connection prompts** when wallet is not connected
- **Loading states** for all async operations
- **Transaction progress indicators** with real-time updates
- **Recovery actions** for common error scenarios

## Components

### Error Handler

Main error handling component with automatic error classification and recovery suggestions.

```tsx
import { ErrorHandler } from '@/components/error-handling';

<ErrorHandler
  error={error}
  onRetry={() => retryOperation()}
  onDismiss={() => setError(null)}
  showDetails={true}
  context="funding project"
/>
```

**Features:**
- Automatic error type classification
- User-friendly error messages
- Recovery action buttons
- Expandable error details
- Special handling for wallet and balance errors

### Wallet Connection Prompt

Prompts users to connect their wallet when required.

```tsx
import { WalletConnectionPrompt } from '@/components/error-handling';

<WalletConnectionPrompt
  onConnect={() => wallet.connect()}
  context="place a bid"
/>
```

### Insufficient Funds Prompt

Shows balance information and guides users to add funds.

```tsx
import { InsufficientFundsPrompt } from '@/components/error-handling';

<InsufficientFundsPrompt
  currentBalance={wallet.usdcBalance}
  requiredAmount="100"
  onAddFunds={() => router.push('/profile?tab=deposit')}
/>
```

### Loading States

Various loading indicators for different scenarios.

```tsx
import { 
  LoadingSpinner,
  TransactionLoading,
  WalletOperationLoading,
  DataLoading 
} from '@/components/error-handling';

// Simple spinner
<LoadingSpinner message="Loading..." />

// Transaction loading with progress
<TransactionLoading 
  message="Processing transaction..."
  step="Signing with wallet"
  progress={50}
/>

// Wallet operation loading
<WalletOperationLoading 
  operation="signing"
  walletType="Freighter"
/>

// Data loading with skeletons
<DataLoading type="projects" count={3} />
```

### Transaction Progress

Real-time transaction progress with step-by-step updates.

```tsx
import { TransactionProgress, useTransactionProgress } from '@/components/error-handling';

function MyComponent() {
  const progress = useTransactionProgress();

  const handleTransaction = async () => {
    progress.startStep('prepare');
    // ... prepare transaction
    
    progress.completeStep('prepare');
    progress.startStep('sign');
    // ... sign transaction
    
    progress.completeStep('sign');
    progress.startStep('submit');
    // ... submit transaction
    
    const hash = await submitTransaction();
    progress.setHash(hash);
    progress.completeStep('submit');
    progress.startStep('confirm');
    
    // ... wait for confirmation
    progress.completeStep('confirm');
  };

  return (
    <TransactionProgress
      steps={progress.steps}
      currentStep={progress.currentStep}
      transactionHash={progress.transactionHash}
      explorerUrl={`https://stellar.expert/explorer/testnet/tx/${progress.transactionHash}`}
    />
  );
}
```

### Async Operation Wrapper

Combines error handling, loading states, and transaction progress.

```tsx
import { AsyncOperationWrapper } from '@/components/error-handling';

<AsyncOperationWrapper
  isLoading={isLoading}
  isTransaction={true}
  error={error}
  loadingMessage="Processing payment..."
  transactionHash={txHash}
  explorerUrl={explorerUrl}
  onRetry={handleRetry}
>
  {/* Your content */}
</AsyncOperationWrapper>
```

### useAsyncOperation Hook

Hook for managing async operations with integrated error handling.

```tsx
import { useAsyncOperation } from '@/components/error-handling';

function MyComponent() {
  const operation = useAsyncOperation({
    isTransaction: true,
    onSuccess: () => toast.success('Success!'),
    onError: (error) => console.error(error),
  });

  const handleSubmit = async () => {
    await operation.execute(async () => {
      // Your async operation
      const result = await submitTransaction();
      operation.setTransactionHash(result.hash);
      return result;
    });
  };

  return (
    <AsyncOperationWrapper
      isLoading={operation.isLoading}
      error={operation.error}
      transactionHash={operation.transactionHash}
      onRetry={() => operation.retry(handleSubmit)}
    >
      <button onClick={handleSubmit}>Submit</button>
    </AsyncOperationWrapper>
  );
}
```

### Async Button

Button component with integrated loading and error handling.

```tsx
import { AsyncButton } from '@/components/error-handling';

<AsyncButton
  onClick={async () => {
    await fundProject(projectId, amount);
  }}
  loadingMessage="Funding project..."
  successMessage="Project funded!"
  isTransaction={true}
>
  Fund Project
</AsyncButton>
```

### Async Form

Form wrapper with integrated error handling.

```tsx
import { AsyncForm } from '@/components/error-handling';

<AsyncForm
  onSubmit={async (e) => {
    const formData = new FormData(e.target);
    await submitBid(formData);
  }}
  loadingMessage="Submitting bid..."
  isTransaction={true}
>
  <input name="amount" />
  <button type="submit">Submit Bid</button>
</AsyncForm>
```

### Error Dialog

Modal dialog for displaying errors.

```tsx
import { ErrorDialog } from '@/components/error-handling';

<ErrorDialog
  open={showError}
  error={error}
  onClose={() => setShowError(false)}
  onRetry={handleRetry}
  title="Transaction Failed"
  context="funding project"
/>
```

## Error Types

The system automatically classifies errors into these types:

- **network**: Network connectivity issues
- **insufficient_funds**: Not enough USDC balance
- **wallet_not_connected**: Wallet needs to be connected
- **wallet_error**: Wallet-related errors (rejected transaction, etc.)
- **transaction_failed**: Transaction submission or confirmation failed
- **validation**: Invalid input or parameters
- **unknown**: Unclassified errors

## Usage Examples

### Basic Error Handling

```tsx
import { ErrorHandler, useErrorHandler } from '@/components/error-handling';

function MyComponent() {
  const errorHandler = useErrorHandler();

  const handleAction = async () => {
    try {
      await someAsyncOperation();
    } catch (error) {
      errorHandler.showError(error, 'performing action');
    }
  };

  return (
    <>
      <button onClick={handleAction}>Do Something</button>
      
      <ErrorDialog
        open={errorHandler.isOpen}
        error={errorHandler.error}
        onClose={errorHandler.clearError}
        onRetry={handleAction}
      />
    </>
  );
}
```

### Transaction with Progress

```tsx
import { 
  useAsyncOperation, 
  TransactionProgress,
  useTransactionProgress 
} from '@/components/error-handling';

function FundProject({ projectId, amount }) {
  const operation = useAsyncOperation({ isTransaction: true });
  const progress = useTransactionProgress();

  const handleFund = async () => {
    await operation.execute(async () => {
      progress.startStep('prepare');
      const tx = await prepareTransaction(projectId, amount);
      
      progress.completeStep('prepare');
      progress.startStep('sign');
      const signed = await signTransaction(tx);
      
      progress.completeStep('sign');
      progress.startStep('submit');
      const result = await submitTransaction(signed);
      
      operation.setTransactionHash(result.hash);
      progress.setHash(result.hash);
      progress.completeStep('submit');
      progress.startStep('confirm');
      
      await waitForConfirmation(result.hash);
      progress.completeStep('confirm');
      
      return result;
    });
  };

  if (operation.isLoading) {
    return (
      <TransactionProgress
        steps={progress.steps}
        currentStep={progress.currentStep}
        transactionHash={progress.transactionHash}
        explorerUrl={`https://stellar.expert/explorer/testnet/tx/${progress.transactionHash}`}
      />
    );
  }

  if (operation.error) {
    return (
      <ErrorHandler
        error={operation.error}
        onRetry={handleFund}
        context="funding project"
      />
    );
  }

  return <button onClick={handleFund}>Fund Project</button>;
}
```

### Wallet Connection Check

```tsx
import { ErrorHandler } from '@/components/error-handling';
import { useWallet } from '@/hooks/use-wallet';

function ProtectedAction() {
  const wallet = useWallet();
  const [error, setError] = useState(null);

  const handleAction = async () => {
    if (!wallet.connected) {
      setError(new Error('Wallet not connected'));
      return;
    }

    try {
      await performAction();
    } catch (err) {
      setError(err);
    }
  };

  return (
    <>
      <button onClick={handleAction}>Perform Action</button>
      
      {error && (
        <ErrorHandler
          error={error}
          onRetry={handleAction}
          onDismiss={() => setError(null)}
        />
      )}
    </>
  );
}
```

### Data Fetching with Loading

```tsx
import { AsyncDataFetcher, DataLoading } from '@/components/error-handling';

function ProjectList() {
  return (
    <AsyncDataFetcher
      fetchFn={async () => {
        const response = await fetch('/api/projects');
        return response.json();
      }}
      loadingComponent={<DataLoading type="projects" count={6} />}
      errorComponent={(error, retry) => (
        <ErrorHandler error={error} onRetry={retry} />
      )}
    >
      {(projects) => (
        <div className="grid grid-cols-3 gap-4">
          {projects.map(project => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </AsyncDataFetcher>
  );
}
```

## Best Practices

1. **Always provide context**: Include context about what operation failed
   ```tsx
   <ErrorHandler error={error} context="funding project" />
   ```

2. **Provide retry actions**: Allow users to retry failed operations
   ```tsx
   <ErrorHandler error={error} onRetry={handleRetry} />
   ```

3. **Use appropriate loading states**: Match loading indicator to operation type
   ```tsx
   // For transactions
   <TransactionLoading message="Processing payment..." />
   
   // For data fetching
   <DataLoading type="projects" />
   ```

4. **Show transaction progress**: Use TransactionProgress for blockchain operations
   ```tsx
   const progress = useTransactionProgress();
   // Update progress as transaction proceeds
   ```

5. **Handle wallet connection**: Check wallet connection before operations
   ```tsx
   if (!wallet.connected) {
     return <WalletConnectionPrompt onConnect={wallet.connect} />;
   }
   ```

6. **Validate balances**: Check sufficient funds before transactions
   ```tsx
   if (parseFloat(wallet.usdcBalance) < amount) {
     return <InsufficientFundsPrompt currentBalance={wallet.usdcBalance} />;
   }
   ```

## Integration with Existing Code

The error handling system integrates with:

- **Stellar SDK errors**: Automatically parsed and classified
- **Wallet errors**: Special handling for connection and signing errors
- **Network errors**: Retry mechanisms and offline detection
- **Balance validation**: Integration with wallet balance checks
- **Transaction tracking**: Blockchain explorer links

## Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { ErrorHandler } from '@/components/error-handling';
import { StellarError, ErrorCode } from '@/lib/stellar/types';

test('displays error message', () => {
  const error = new StellarError('Test error', ErrorCode.NETWORK_ERROR);
  render(<ErrorHandler error={error} />);
  
  expect(screen.getByText(/network error/i)).toBeInTheDocument();
});

test('calls retry handler', () => {
  const onRetry = jest.fn();
  const error = new Error('Test error');
  
  render(<ErrorHandler error={error} onRetry={onRetry} />);
  
  fireEvent.click(screen.getByText(/try again/i));
  expect(onRetry).toHaveBeenCalled();
});
```

## Requirements Covered

This implementation addresses all requirements from task 11:

- ✅ **11.1**: Centralized error handler component
- ✅ **11.2**: User-friendly error messages for common failures
- ✅ **11.3**: Wallet connection prompts when needed
- ✅ **11.4**: Loading states for all async operations
- ✅ **11.5**: Transaction progress indicators

Requirements: 10.1, 10.2, 10.3, 10.4, 10.5
