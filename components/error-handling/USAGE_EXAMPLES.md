# Error Handling System - Usage Examples

Practical examples for integrating the error handling system into your components.

## Example 1: Fund Project with Full Error Handling

```tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/hooks/use-wallet';
import { 
  useAsyncOperation,
  TransactionProgress,
  useTransactionProgress,
  ErrorHandler,
  WalletConnectionPrompt,
  InsufficientFundsPrompt
} from '@/components/error-handling';
import { Button } from '@/components/ui/button';
import { fundProject } from '@/lib/stellar/services/crowdfunding';

export function FundProjectButton({ projectId, amount }: { projectId: string; amount: string }) {
  const wallet = useWallet();
  const router = useRouter();
  const operation = useAsyncOperation({ isTransaction: true });
  const progress = useTransactionProgress();

  // Check wallet connection
  if (!wallet.connected) {
    return (
      <WalletConnectionPrompt
        onConnect={() => wallet.connect()}
        context="fund this project"
      />
    );
  }

  // Check sufficient balance
  const hasInsufficientFunds = parseFloat(wallet.usdcBalance || '0') < parseFloat(amount);
  if (hasInsufficientFunds) {
    return (
      <InsufficientFundsPrompt
        currentBalance={wallet.usdcBalance || '0'}
        requiredAmount={amount}
        onAddFunds={() => router.push('/profile?tab=deposit')}
      />
    );
  }

  const handleFund = async () => {
    await operation.execute(async () => {
      // Step 1: Prepare
      progress.startStep('prepare');
      await new Promise(resolve => setTimeout(resolve, 500));
      progress.completeStep('prepare');

      // Step 2: Sign
      progress.startStep('sign');
      const result = await fundProject(projectId, amount);
      progress.completeStep('sign');

      // Step 3: Submit
      progress.startStep('submit');
      operation.setTransactionHash(result.hash);
      progress.setHash(result.hash);
      progress.completeStep('submit');

      // Step 4: Confirm
      progress.startStep('confirm');
      await new Promise(resolve => setTimeout(resolve, 2000));
      progress.completeStep('confirm');

      return result;
    });
  };

  // Show transaction progress
  if (operation.isLoading) {
    return (
      <TransactionProgress
        steps={progress.steps}
        currentStep={progress.currentStep}
        transactionHash={progress.transactionHash}
        explorerUrl={
          progress.transactionHash
            ? `https://stellar.expert/explorer/testnet/tx/${progress.transactionHash}`
            : undefined
        }
      />
    );
  }

  // Show error
  if (operation.error) {
    return (
      <ErrorHandler
        error={operation.error}
        onRetry={handleFund}
        onDismiss={operation.reset}
        context="funding project"
        showDetails={true}
      />
    );
  }

  // Show success
  if (operation.isSuccess) {
    return (
      <div className="text-center space-y-2">
        <p className="text-green-500 font-medium">✓ Project funded successfully!</p>
        <Button onClick={operation.reset} variant="outline" size="sm">
          Fund Again
        </Button>
      </div>
    );
  }

  // Show button
  return (
    <Button onClick={handleFund} size="lg" className="w-full">
      Fund ${amount} USDC
    </Button>
  );
}
```

## Example 2: Place Bid with Wallet Signing

```tsx
'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import {
  AsyncForm,
  WalletOperationLoading,
  ErrorHandler,
  useAsyncOperation
} from '@/components/error-handling';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { submitBid } from '@/lib/stellar/services/escrow';

export function PlaceBidForm({ projectId }: { projectId: string }) {
  const wallet = useWallet();
  const operation = useAsyncOperation({ isTransaction: true });
  const [formData, setFormData] = useState({
    amount: '',
    deliveryDays: '',
    proposal: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await operation.execute(async () => {
      // Sign bid with wallet
      const message = JSON.stringify({
        projectId,
        ...formData,
        timestamp: Date.now(),
      });

      const signature = await wallet.signMessage(message);

      // Submit bid
      const result = await submitBid({
        projectId,
        ...formData,
        signature,
      });

      return result;
    });
  };

  if (!wallet.connected) {
    return (
      <div className="text-center p-6">
        <p className="mb-4">Connect your wallet to place a bid</p>
        <Button onClick={() => wallet.connect()}>Connect Wallet</Button>
      </div>
    );
  }

  if (operation.isLoading) {
    return (
      <WalletOperationLoading
        operation="signing"
        walletType={wallet.walletType || undefined}
      />
    );
  }

  if (operation.error) {
    return (
      <ErrorHandler
        error={operation.error}
        onRetry={() => handleSubmit(new Event('submit') as any)}
        onDismiss={operation.reset}
        context="placing bid"
      />
    );
  }

  if (operation.isSuccess) {
    return (
      <div className="text-center p-6 space-y-4">
        <p className="text-green-500 font-medium text-lg">✓ Bid submitted successfully!</p>
        <Button onClick={operation.reset} variant="outline">
          Submit Another Bid
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Bid Amount (USDC)</label>
        <Input
          type="number"
          value={formData.amount}
          onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
          placeholder="1000"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Delivery Time (days)</label>
        <Input
          type="number"
          value={formData.deliveryDays}
          onChange={(e) => setFormData({ ...formData, deliveryDays: e.target.value })}
          placeholder="30"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Proposal</label>
        <Textarea
          value={formData.proposal}
          onChange={(e) => setFormData({ ...formData, proposal: e.target.value })}
          placeholder="Describe your approach..."
          rows={5}
          required
        />
      </div>

      <Button type="submit" className="w-full">
        Submit Bid
      </Button>
    </form>
  );
}
```

## Example 3: Browse Projects with Data Loading

```tsx
'use client';

import { AsyncDataFetcher, DataLoading, ErrorHandler } from '@/components/error-handling';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Project {
  id: string;
  title: string;
  budget: string;
  funded: string;
}

export function ProjectList() {
  const fetchProjects = async (): Promise<Project[]> => {
    const response = await fetch('/api/projects');
    if (!response.ok) {
      throw new Error('Failed to fetch projects');
    }
    return response.json();
  };

  return (
    <AsyncDataFetcher
      fetchFn={fetchProjects}
      loadingComponent={<DataLoading type="projects" count={6} />}
      errorComponent={(error, retry) => (
        <ErrorHandler
          error={error}
          onRetry={retry}
          context="loading projects"
        />
      )}
    >
      {(projects) => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map((project) => (
            <Card key={project.id}>
              <CardHeader>
                <CardTitle>{project.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Budget:</span>
                    <span className="font-semibold">${project.budget} USDC</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Funded:</span>
                    <span className="font-semibold">${project.funded} USDC</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </AsyncDataFetcher>
  );
}
```

## Example 4: Withdraw Funds with Progress

```tsx
'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import {
  useAsyncOperation,
  TransactionProgress,
  useTransactionProgress,
  ErrorDialog,
  CompactTransactionProgress
} from '@/components/error-handling';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { withdrawFunds } from '@/lib/stellar/services/escrow';

export function WithdrawButton({ escrowId, amount }: { escrowId: string; amount: string }) {
  const wallet = useWallet();
  const operation = useAsyncOperation({ isTransaction: true });
  const progress = useTransactionProgress();
  const [showDialog, setShowDialog] = useState(false);

  const handleWithdraw = async () => {
    setShowDialog(true);

    await operation.execute(async () => {
      progress.startStep('prepare');
      await new Promise(resolve => setTimeout(resolve, 500));
      progress.completeStep('prepare');

      progress.startStep('sign');
      const result = await withdrawFunds(escrowId);
      progress.completeStep('sign');

      progress.startStep('submit');
      operation.setTransactionHash(result.hash);
      progress.setHash(result.hash);
      progress.completeStep('submit');

      progress.startStep('confirm');
      await new Promise(resolve => setTimeout(resolve, 2000));
      progress.completeStep('confirm');

      // Refresh wallet balance
      await wallet.refreshBalance();

      return result;
    });
  };

  return (
    <>
      <Button onClick={handleWithdraw} variant="default">
        Withdraw ${amount} USDC
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Withdraw Funds</DialogTitle>
          </DialogHeader>

          {operation.isLoading && (
            <TransactionProgress
              steps={progress.steps}
              currentStep={progress.currentStep}
              transactionHash={progress.transactionHash}
              explorerUrl={
                progress.transactionHash
                  ? `https://stellar.expert/explorer/testnet/tx/${progress.transactionHash}`
                  : undefined
              }
            />
          )}

          {operation.isSuccess && (
            <div className="text-center space-y-4 py-6">
              <div className="text-green-500 text-5xl">✓</div>
              <p className="text-lg font-medium">Withdrawal Successful!</p>
              <p className="text-muted-foreground">
                ${amount} USDC has been transferred to your wallet
              </p>
              <Button onClick={() => setShowDialog(false)}>Close</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <ErrorDialog
        open={!!operation.error}
        error={operation.error}
        onClose={operation.reset}
        onRetry={handleWithdraw}
        title="Withdrawal Failed"
        context="withdrawing funds"
      />
    </>
  );
}
```

## Example 5: Complete Milestone with Inline Progress

```tsx
'use client';

import { useState } from 'react';
import {
  useAsyncOperation,
  CompactTransactionProgress,
  ErrorHandler
} from '@/components/error-handling';
import { Button } from '@/components/ui/button';
import { completeMilestone } from '@/lib/stellar/services/escrow';

export function CompleteMilestoneButton({ 
  escrowId, 
  milestoneId 
}: { 
  escrowId: string; 
  milestoneId: number;
}) {
  const operation = useAsyncOperation({ isTransaction: true });

  const handleComplete = async () => {
    await operation.execute(async () => {
      const result = await completeMilestone(escrowId, milestoneId);
      operation.setTransactionHash(result.hash);
      return result;
    });
  };

  if (operation.isLoading) {
    return (
      <CompactTransactionProgress
        status="submitting"
        message="Releasing milestone funds..."
      />
    );
  }

  if (operation.error) {
    return (
      <div className="space-y-2">
        <ErrorHandler
          error={operation.error}
          onRetry={handleComplete}
          onDismiss={operation.reset}
          context="completing milestone"
        />
      </div>
    );
  }

  if (operation.isSuccess) {
    return (
      <div className="flex items-center gap-2 text-green-500">
        <span>✓</span>
        <span className="text-sm font-medium">Milestone completed</span>
      </div>
    );
  }

  return (
    <Button onClick={handleComplete} variant="default" size="sm">
      Mark as Complete
    </Button>
  );
}
```

## Example 6: Profile Page with Multiple Operations

```tsx
'use client';

import { useState } from 'react';
import { useWallet } from '@/hooks/use-wallet';
import {
  ErrorHandler,
  LoadingSpinner,
  OverlayLoading,
  useLoadingState
} from '@/components/error-handling';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function ProfilePage() {
  const wallet = useWallet();
  const [error, setError] = useState<Error | null>(null);
  const loading = useLoadingState();

  const handleDeposit = async () => {
    await loading.withLoading(async () => {
      try {
        // Deposit logic
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        setError(err as Error);
      }
    }, 'Processing deposit...');
  };

  const handleWithdraw = async () => {
    await loading.withLoading(async () => {
      try {
        // Withdraw logic
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (err) {
        setError(err as Error);
      }
    }, 'Processing withdrawal...');
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Balance Display */}
          <div className="mb-6 p-4 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground">USDC Balance</p>
            <p className="text-3xl font-bold">
              ${wallet.usdcBalance || '0.00'} USDC
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <ErrorHandler
              error={error}
              onDismiss={() => setError(null)}
              className="mb-6"
            />
          )}

          {/* Tabs */}
          <Tabs defaultValue="deposit">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="deposit">Deposit</TabsTrigger>
              <TabsTrigger value="withdraw">Withdraw</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="deposit">
              {/* Deposit form */}
              <button onClick={handleDeposit}>Deposit</button>
            </TabsContent>

            <TabsContent value="withdraw">
              {/* Withdraw form */}
              <button onClick={handleWithdraw}>Withdraw</button>
            </TabsContent>

            <TabsContent value="history">
              {/* Transaction history */}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Overlay loading */}
      <OverlayLoading
        show={loading.isLoading}
        message={loading.loadingMessage}
      />
    </div>
  );
}
```

## Key Patterns

### 1. Always Check Wallet Connection First
```tsx
if (!wallet.connected) {
  return <WalletConnectionPrompt onConnect={wallet.connect} />;
}
```

### 2. Validate Balance Before Transactions
```tsx
if (parseFloat(wallet.usdcBalance || '0') < parseFloat(amount)) {
  return <InsufficientFundsPrompt currentBalance={wallet.usdcBalance} />;
}
```

### 3. Use Transaction Progress for Blockchain Operations
```tsx
const progress = useTransactionProgress();
// Update progress through transaction lifecycle
```

### 4. Provide Context in Error Messages
```tsx
<ErrorHandler error={error} context="funding project" />
```

### 5. Always Offer Retry Actions
```tsx
<ErrorHandler error={error} onRetry={handleRetry} />
```

These examples demonstrate the complete integration of the error handling system across different use cases in the dApp.
