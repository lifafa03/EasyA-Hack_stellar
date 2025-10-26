# USDC Balance Validation Usage Guide

This guide explains how to use the USDC balance validation utilities across all payment flows in the application.

## Overview

The balance validation system provides:
- Pre-transaction USDC balance checking
- User-friendly error messages with actionable guidance
- Reusable UI components for displaying validation results
- Automatic balance checking with debouncing
- Transaction-specific warnings and recommendations

## Core Utilities

### 1. `validateUSDCBalance()`

Validates if an account has sufficient USDC balance for a transaction.

```typescript
import { validateUSDCBalance } from '@/lib/stellar/balance-validation';

const result = await validateUSDCBalance(
  publicKey,
  requiredAmount,
  {
    includeReserve: true,  // Reserve some USDC for fees
    reserveAmount: '1.0'   // Amount to reserve (default: 1 USDC)
  }
);

// Result structure:
// {
//   isValid: boolean;
//   available: string;
//   required: string;
//   shortfall?: string;
//   message?: string;
//   needsDeposit: boolean;
// }
```

### 2. `preTransactionValidation()`

Comprehensive pre-transaction validation with transaction-specific warnings.

```typescript
import { preTransactionValidation } from '@/lib/stellar/balance-validation';

const validation = await preTransactionValidation(
  publicKey,
  amount,
  'funding' // or 'bid', 'escrow', 'payment'
);

// Returns:
// {
//   canProceed: boolean;
//   validationResult: BalanceValidationResult;
//   warnings?: string[];
// }
```

### 3. `hasUSDCBalance()`

Quick boolean check for sufficient balance.

```typescript
import { hasUSDCBalance } from '@/lib/stellar/balance-validation';

const hasSufficientBalance = await hasUSDCBalance(publicKey, requiredAmount);
```

### 4. `formatUSDC()`

Format USDC amounts for display.

```typescript
import { formatUSDC } from '@/lib/stellar/balance-validation';

formatUSDC(1234.56);                    // "$1,234.56 USDC"
formatUSDC(1234.56, { showSymbol: false }); // "1,234.56"
formatUSDC(1234.56789, { decimals: 4 });    // "$1,234.5679 USDC"
```

## UI Components

### 1. `BalanceValidationAlert`

Displays validation results with appropriate styling and actions.

```tsx
import { BalanceValidationAlert } from '@/components/balance-validation-alert';

<BalanceValidationAlert 
  validationResult={validationResult}
  showDetails={true}
/>
```

Features:
- Green success state for sufficient balance
- Red error state for insufficient balance
- Automatic "Deposit USDC" link to Profile page
- Detailed breakdown of available, required, and shortfall amounts

### 2. `BalanceDisplay`

Simple balance comparison display for modals.

```tsx
import { BalanceDisplay } from '@/components/balance-validation-alert';

<BalanceDisplay 
  available={usdcBalance}
  required={amount}
/>
```

### 3. `TransactionWarnings`

Display transaction-specific warnings.

```tsx
import { TransactionWarnings } from '@/components/balance-validation-alert';

<TransactionWarnings warnings={validation.warnings} />
```

## Integration Examples

### Example 1: Bid Submission Dialog

```tsx
import { preTransactionValidation } from '@/lib/stellar/balance-validation';
import { BalanceValidationAlert, BalanceDisplay } from '@/components/balance-validation-alert';

function BidSubmissionDialog({ walletPublicKey, usdcBalance }) {
  const [balanceValidation, setBalanceValidation] = useState(null);

  // Check balance when amount changes
  useEffect(() => {
    const checkBalance = async () => {
      if (bidAmount && walletPublicKey) {
        const validation = await preTransactionValidation(
          walletPublicKey,
          bidAmount,
          'bid'
        );
        setBalanceValidation(validation);
      }
    };

    const debounce = setTimeout(checkBalance, 500);
    return () => clearTimeout(debounce);
  }, [bidAmount, walletPublicKey]);

  const handleSubmit = async () => {
    // Validate before submission
    if (!balanceValidation?.canProceed) {
      setError('Insufficient USDC balance');
      return;
    }

    // Proceed with bid submission
    await submitBid();
  };

  return (
    <Dialog>
      {/* Show validation alert if insufficient */}
      {balanceValidation && !balanceValidation.canProceed && (
        <BalanceValidationAlert 
          validationResult={balanceValidation.validationResult}
          showDetails={true}
        />
      )}

      {/* Show warnings if valid but with caveats */}
      {balanceValidation?.warnings && (
        <TransactionWarnings warnings={balanceValidation.warnings} />
      )}

      {/* Show balance comparison */}
      {bidAmount && usdcBalance && (
        <BalanceDisplay 
          available={usdcBalance}
          required={bidAmount}
        />
      )}

      <Button onClick={handleSubmit}>Submit Bid</Button>
    </Dialog>
  );
}
```

### Example 2: Project Funding

```tsx
import { validateUSDCBalance, formatUSDC } from '@/lib/stellar/balance-validation';

async function handleFundProject(amount: string) {
  // Validate balance
  const validation = await validateUSDCBalance(publicKey, amount);

  if (!validation.isValid) {
    toast.error(validation.message, {
      action: validation.needsDeposit ? {
        label: 'Deposit USDC',
        onClick: () => router.push('/profile?tab=deposit')
      } : undefined
    });
    return;
  }

  // Proceed with funding
  await fundProject(amount);
  toast.success(`Successfully funded ${formatUSDC(amount)}`);
}
```

### Example 3: Escrow Creation

```tsx
import { validateMultipleAmounts } from '@/lib/stellar/balance-validation';

async function validateEscrowForm() {
  // Validate total of all milestones
  const milestoneAmounts = milestones.map(m => m.amount);
  const validation = await validateMultipleAmounts(publicKey, milestoneAmounts);

  if (!validation.isValid) {
    setError(`Insufficient balance. Need ${validation.totalRequired} USDC total`);
    return false;
  }

  return true;
}
```

## Best Practices

### 1. Always Validate Before Transactions

```typescript
// ✅ Good
const validation = await preTransactionValidation(publicKey, amount, 'funding');
if (!validation.canProceed) {
  // Show error and stop
  return;
}
await executeTransaction();

// ❌ Bad
await executeTransaction(); // No validation
```

### 2. Use Debouncing for Real-Time Checks

```typescript
// ✅ Good - Debounced balance check
useEffect(() => {
  const checkBalance = async () => {
    await validateUSDCBalance(publicKey, amount);
  };
  const debounce = setTimeout(checkBalance, 500);
  return () => clearTimeout(debounce);
}, [amount]);

// ❌ Bad - Checks on every keystroke
useEffect(() => {
  validateUSDCBalance(publicKey, amount);
}, [amount]);
```

### 3. Show Balance Display in Payment Modals

```tsx
// ✅ Good - User sees balance before submitting
<Dialog>
  <Input value={amount} onChange={...} />
  <BalanceDisplay available={balance} required={amount} />
  <Button>Submit</Button>
</Dialog>

// ❌ Bad - User doesn't know their balance
<Dialog>
  <Input value={amount} onChange={...} />
  <Button>Submit</Button>
</Dialog>
```

### 4. Provide Clear Error Messages

```typescript
// ✅ Good - Actionable error with link
if (!validation.isValid) {
  return (
    <BalanceValidationAlert 
      validationResult={validation}
      showDetails={true}
    />
  );
}

// ❌ Bad - Generic error
if (!validation.isValid) {
  return <Alert>Insufficient balance</Alert>;
}
```

### 5. Include Transaction Warnings

```typescript
// ✅ Good - Show warnings even when valid
{balanceValidation?.warnings && (
  <TransactionWarnings warnings={balanceValidation.warnings} />
)}

// ❌ Bad - Only show errors
{!balanceValidation?.canProceed && <Alert>Error</Alert>}
```

## Transaction Types

The validation system supports different transaction types with specific warnings:

- **`funding`**: Warns about escrow lock-up
- **`bid`**: Reminds to maintain balance for project completion
- **`escrow`**: Warns about withdrawal restrictions
- **`payment`**: General payment warnings

## Error Handling

The validation utilities handle various error scenarios:

1. **No USDC Trustline**: Prompts user to set up USDC
2. **Insufficient Balance**: Shows shortfall and deposit link
3. **Invalid Amount**: Validates input format
4. **Network Errors**: Graceful fallback with retry option

## Testing

When testing components with balance validation:

```typescript
// Mock the validation function
jest.mock('@/lib/stellar/balance-validation', () => ({
  preTransactionValidation: jest.fn().mockResolvedValue({
    canProceed: true,
    validationResult: {
      isValid: true,
      available: '1000',
      required: '100',
      needsDeposit: false,
    },
  }),
}));
```

## Summary

The balance validation system ensures:
- ✅ Users always know their balance before transactions
- ✅ Clear error messages with actionable guidance
- ✅ Consistent UX across all payment flows
- ✅ Prevention of failed transactions due to insufficient funds
- ✅ Automatic linking to deposit page when needed
