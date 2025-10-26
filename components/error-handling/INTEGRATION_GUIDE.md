# Error Handling System - Integration Guide

Quick guide for integrating the error handling system into existing components.

## Quick Start

### 1. Import Components

```tsx
import {
  ErrorHandler,
  useAsyncOperation,
  TransactionProgress,
  useTransactionProgress,
  WalletConnectionPrompt,
  InsufficientFundsPrompt,
  LoadingSpinner,
  TransactionLoading,
} from '@/components/error-handling';
```

### 2. Replace Existing Error Handling

**Before:**
```tsx
const [error, setError] = useState<string | null>(null);
const [loading, setLoading] = useState(false);

const handleAction = async () => {
  setLoading(true);
  try {
    await someAction();
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

return (
  <>
    {loading && <div>Loading...</div>}
    {error && <div className="text-red-500">{error}</div>}
    <button onClick={handleAction}>Do Something</button>
  </>
);
```

**After:**
```tsx
const operation = useAsyncOperation();

const handleAction = async () => {
  await operation.execute(async () => {
    await someAction();
  });
};

return (
  <>
    {operation.isLoading && <LoadingSpinner message="Processing..." />}
    {operation.error && (
      <ErrorHandler
        error={operation.error}
        onRetry={handleAction}
        onDismiss={operation.reset}
      />
    )}
    <button onClick={handleAction} disabled={operation.isLoading}>
      Do Something
    </button>
  </>
);
```

### 3. Add Wallet Connection Checks

**Add to any component that requires wallet:**
```tsx
const wallet = useWallet();

// At the start of your component render
if (!wallet.connected) {
  return (
    <WalletConnectionPrompt
      onConnect={() => wallet.connect()}
      context="perform this action"
    />
  );
}
```

### 4. Add Balance Validation

**Add before any USDC transaction:**
```tsx
const requiredAmount = "100"; // USDC amount needed

if (parseFloat(wallet.usdcBalance || '0') < parseFloat(requiredAmount)) {
  return (
    <InsufficientFundsPrompt
      currentBalance={wallet.usdcBalance || '0'}
      requiredAmount={requiredAmount}
      onAddFunds={() => router.push('/profile?tab=deposit')}
    />
  );
}
```

### 5. Add Transaction Progress

**For blockchain transactions:**
```tsx
const operation = useAsyncOperation({ isTransaction: true });
const progress = useTransactionProgress();

const handleTransaction = async () => {
  await operation.execute(async () => {
    progress.startStep('prepare');
    // Prepare transaction
    progress.completeStep('prepare');
    
    progress.startStep('sign');
    const result = await signAndSubmit();
    progress.completeStep('sign');
    
    progress.startStep('submit');
    operation.setTransactionHash(result.hash);
    progress.setHash(result.hash);
    progress.completeStep('submit');
    
    progress.startStep('confirm');
    await waitForConfirmation();
    progress.completeStep('confirm');
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
```

## Component-Specific Integration

### Browse Page (`app/browse/page.tsx`)

```tsx
import { AsyncDataFetcher, DataLoading, ErrorHandler } from '@/components/error-handling';

export default function BrowsePage() {
  return (
    <AsyncDataFetcher
      fetchFn={fetchProjects}
      loadingComponent={<DataLoading type="projects" count={6} />}
      errorComponent={(error, retry) => (
        <ErrorHandler error={error} onRetry={retry} context="loading projects" />
      )}
    >
      {(projects) => (
        <div className="grid grid-cols-3 gap-4">
          {projects.map(project => <ProjectCard key={project.id} project={project} />)}
        </div>
      )}
    </AsyncDataFetcher>
  );
}
```

### Project Detail Page (`app/project/[id]/page.tsx`)

```tsx
import { 
  useAsyncOperation, 
  TransactionProgress, 
  useTransactionProgress,
  ErrorHandler,
  WalletConnectionPrompt,
  InsufficientFundsPrompt
} from '@/components/error-handling';

export default function ProjectDetailPage({ params }: { params: { id: string } }) {
  const wallet = useWallet();
  const operation = useAsyncOperation({ isTransaction: true });
  const progress = useTransactionProgress();

  // Wallet check
  if (!wallet.connected) {
    return <WalletConnectionPrompt onConnect={wallet.connect} context="fund this project" />;
  }

  // Balance check
  const projectBudget = "1000";
  if (parseFloat(wallet.usdcBalance || '0') < parseFloat(projectBudget)) {
    return (
      <InsufficientFundsPrompt
        currentBalance={wallet.usdcBalance || '0'}
        requiredAmount={projectBudget}
        onAddFunds={() => router.push('/profile?tab=deposit')}
      />
    );
  }

  const handleFund = async () => {
    await operation.execute(async () => {
      progress.startStep('prepare');
      // ... funding logic
    });
  };

  // Show transaction progress
  if (operation.isLoading) {
    return <TransactionProgress steps={progress.steps} />;
  }

  // Show error
  if (operation.error) {
    return <ErrorHandler error={operation.error} onRetry={handleFund} />;
  }

  return (
    <div>
      {/* Project details */}
      <button onClick={handleFund}>Fund Project</button>
    </div>
  );
}
```

### Profile Page (`app/profile/page.tsx`)

```tsx
import { 
  useLoadingState, 
  OverlayLoading, 
  ErrorHandler 
} from '@/components/error-handling';

export default function ProfilePage() {
  const loading = useLoadingState();
  const [error, setError] = useState<Error | null>(null);

  const handleDeposit = async () => {
    await loading.withLoading(async () => {
      try {
        await depositFunds();
      } catch (err) {
        setError(err as Error);
      }
    }, 'Processing deposit...');
  };

  return (
    <div>
      {error && (
        <ErrorHandler
          error={error}
          onRetry={handleDeposit}
          onDismiss={() => setError(null)}
        />
      )}
      
      <button onClick={handleDeposit}>Deposit</button>
      
      <OverlayLoading show={loading.isLoading} message={loading.loadingMessage} />
    </div>
  );
}
```

### Dashboard Page (`app/dashboard/page.tsx`)

```tsx
import { AsyncDataFetcher, DataLoading } from '@/components/error-handling';

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <section>
        <h2>My Bids</h2>
        <AsyncDataFetcher
          fetchFn={fetchMyBids}
          loadingComponent={<DataLoading type="bids" count={3} />}
        >
          {(bids) => <BidsList bids={bids} />}
        </AsyncDataFetcher>
      </section>

      <section>
        <h2>My Investments</h2>
        <AsyncDataFetcher
          fetchFn={fetchMyInvestments}
          loadingComponent={<DataLoading type="projects" count={3} />}
        >
          {(investments) => <InvestmentsList investments={investments} />}
        </AsyncDataFetcher>
      </section>
    </div>
  );
}
```

## Common Patterns

### Pattern 1: Simple Button Action
```tsx
const operation = useAsyncOperation();

<button 
  onClick={() => operation.execute(async () => await doSomething())}
  disabled={operation.isLoading}
>
  {operation.isLoading ? 'Loading...' : 'Click Me'}
</button>
```

### Pattern 2: Form Submission
```tsx
const operation = useAsyncOperation();

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  await operation.execute(async () => {
    await submitForm(formData);
  });
};

<form onSubmit={handleSubmit}>
  {/* form fields */}
  <button type="submit" disabled={operation.isLoading}>
    Submit
  </button>
</form>
```

### Pattern 3: Data Fetching on Mount
```tsx
const operation = useAsyncOperation();

useEffect(() => {
  operation.execute(async () => {
    const data = await fetchData();
    setData(data);
  });
}, []);

if (operation.isLoading) return <LoadingSpinner />;
if (operation.error) return <ErrorHandler error={operation.error} />;
```

### Pattern 4: Transaction with All Features
```tsx
const wallet = useWallet();
const operation = useAsyncOperation({ isTransaction: true });
const progress = useTransactionProgress();

// 1. Check wallet
if (!wallet.connected) {
  return <WalletConnectionPrompt onConnect={wallet.connect} />;
}

// 2. Check balance
if (insufficient) {
  return <InsufficientFundsPrompt />;
}

// 3. Execute transaction
const handleTransaction = async () => {
  await operation.execute(async () => {
    // Update progress through steps
    progress.startStep('prepare');
    // ... etc
  });
};

// 4. Show progress
if (operation.isLoading) {
  return <TransactionProgress steps={progress.steps} />;
}

// 5. Show error
if (operation.error) {
  return <ErrorHandler error={operation.error} onRetry={handleTransaction} />;
}

// 6. Show success
if (operation.isSuccess) {
  return <div>Success!</div>;
}
```

## Migration Checklist

- [ ] Replace manual loading states with `useLoadingState` or `useAsyncOperation`
- [ ] Replace manual error handling with `ErrorHandler` component
- [ ] Add wallet connection checks with `WalletConnectionPrompt`
- [ ] Add balance validation with `InsufficientFundsPrompt`
- [ ] Add transaction progress with `TransactionProgress`
- [ ] Replace loading spinners with appropriate loading components
- [ ] Add context to error messages
- [ ] Add retry actions to error handlers
- [ ] Test error scenarios (network, wallet, balance)
- [ ] Test loading states
- [ ] Test transaction progress
- [ ] Update documentation

## Testing

### Test Error Scenarios
```tsx
// Simulate network error
const error = new StellarError('Network error', ErrorCode.NETWORK_ERROR);
render(<ErrorHandler error={error} />);

// Simulate wallet not connected
const error = new Error('Wallet not connected');
render(<ErrorHandler error={error} />);

// Simulate insufficient funds
const error = new StellarError('Insufficient funds', ErrorCode.INSUFFICIENT_FUNDS);
render(<ErrorHandler error={error} />);
```

### Test Loading States
```tsx
const { result } = renderHook(() => useLoadingState());

act(() => {
  result.current.startLoading('Loading...');
});

expect(result.current.isLoading).toBe(true);
expect(result.current.loadingMessage).toBe('Loading...');
```

### Test Transaction Progress
```tsx
const { result } = renderHook(() => useTransactionProgress());

act(() => {
  result.current.startStep('prepare');
});

expect(result.current.steps[0].status).toBe('active');
```

## Support

For questions or issues:
1. Check the README.md for component documentation
2. Review USAGE_EXAMPLES.md for practical examples
3. Check existing implementations in the codebase
4. Refer to the Stellar SDK documentation for error codes

## Next Steps

1. Integrate into Browse page
2. Integrate into Project Detail page
3. Integrate into Profile page
4. Integrate into Dashboard page
5. Test all error scenarios
6. Test all loading states
7. Test transaction flows
8. Update existing components
9. Add analytics tracking
10. Monitor error rates in production
