# useFiatBalance Hook

## Overview

The `useFiatBalance` hook provides balance management and pending transaction tracking for the fiat gateway. It integrates with the wallet hook to provide real-time balance updates and transaction status monitoring.

## Features

- **Balance Tracking**: Access current XLM and USDC balances
- **Pending Transactions**: Track pending on-ramp and off-ramp transactions
- **Automatic Polling**: Automatically refreshes balance when transactions are pending
- **Transaction Management**: Track and update transaction statuses
- **Balance Notifications**: Shows toast notifications when balance changes

## Usage

```tsx
import { useFiatBalance } from '@/hooks/use-fiat-balance';

function MyComponent() {
  const fiatBalance = useFiatBalance();

  return (
    <div>
      {/* Display balance */}
      <p>Balance: {fiatBalance.usdcBalance} USDC</p>
      
      {/* Show pending transactions indicator */}
      {fiatBalance.hasPendingTransactions && (
        <Badge>
          {fiatBalance.pendingTransactions.length} Pending
        </Badge>
      )}
      
      {/* Show pending amounts */}
      {parseFloat(fiatBalance.pendingOnRampAmount) > 0 && (
        <p>+{fiatBalance.pendingOnRampAmount} USDC pending</p>
      )}
      
      {/* Refresh balance manually */}
      <Button onClick={fiatBalance.refreshBalance}>
        Refresh Balance
      </Button>
    </div>
  );
}
```

## API Reference

### Return Values

- `balance: string | null` - Current XLM balance
- `usdcBalance: string | null` - Current USDC balance
- `pendingTransactions: PendingTransaction[]` - Array of pending transactions
- `hasPendingTransactions: boolean` - Whether there are any pending transactions
- `pendingOnRampAmount: string` - Total amount of pending deposits (USDC)
- `pendingOffRampAmount: string` - Total amount of pending withdrawals (USDC)
- `isRefreshing: boolean` - Whether balance is currently being refreshed

### Methods

#### `refreshBalance(): Promise<void>`
Manually refresh the wallet balance. Automatically called when transactions complete.

#### `trackTransaction(transaction: FiatTransaction): void`
Track a new fiat transaction. Automatically saves to storage and updates pending list.

```tsx
fiatBalance.trackTransaction({
  id: 'tx_123',
  type: 'on-ramp',
  status: 'pending_anchor',
  amount: '100.00',
  currency: 'USD',
  cryptoAmount: '100.00',
  cryptoCurrency: 'USDC',
  exchangeRate: '1.0',
  fees: '2.50',
  anchorId: 'moneygram',
  anchorName: 'MoneyGram Access',
  createdAt: Date.now(),
});
```

#### `updateTransactionStatus(transactionId: string, status: TransactionStatus): void`
Update the status of a tracked transaction. Automatically refreshes balance when status is 'completed'.

```tsx
fiatBalance.updateTransactionStatus('tx_123', 'completed');
```

## Integration with Fiat Gateway

The hook is automatically integrated with the on-ramp and off-ramp flows:

1. When a transaction starts, it's automatically tracked
2. Status updates are automatically saved
3. Balance is automatically refreshed when transactions complete
4. Pending transactions are displayed in wallet components

## Automatic Polling

When there are pending transactions, the hook automatically polls for balance updates every 30 seconds. This ensures the UI stays up-to-date without manual intervention.

## Storage

Transaction data is stored in localStorage using the `fiat-transactions` storage module. Transactions older than 90 days are automatically cleaned up.

## Examples

### Display Pending Deposits in Balance

```tsx
<div>
  <span>{formatBalance(wallet.usdcBalance)} USDC</span>
  {parseFloat(fiatBalance.pendingOnRampAmount) > 0 && (
    <span className="text-yellow-500">
      (+{fiatBalance.pendingOnRampAmount})
    </span>
  )}
</div>
```

### Show Pending Transaction Badge

```tsx
{fiatBalance.hasPendingTransactions && (
  <Badge variant="outline" className="text-yellow-500">
    <Clock className="h-3 w-3 mr-1" />
    {fiatBalance.pendingTransactions.length} Pending
  </Badge>
)}
```

### Manual Balance Refresh with Loading State

```tsx
<Button 
  onClick={fiatBalance.refreshBalance}
  disabled={fiatBalance.isRefreshing}
>
  {fiatBalance.isRefreshing ? 'Refreshing...' : 'Refresh Balance'}
</Button>
```
