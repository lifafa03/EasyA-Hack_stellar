# USDC Balance Validation - Quick Reference

## Import Statements

```typescript
// Core utilities
import { 
  validateUSDCBalance,
  hasUSDCBalance,
  preTransactionValidation,
  formatUSDC,
  validateMultipleAmounts
} from '@/lib/stellar/balance-validation';

// UI components
import { 
  BalanceValidationAlert,
  BalanceDisplay,
  TransactionWarnings
} from '@/components/balance-validation-alert';

// Pre-built dialog
import { FundProjectDialog } from '@/components/fund-project-dialog';
```

## Quick Usage

### 1. Validate Balance (Simple)

```typescript
const isValid = await hasUSDCBalance(publicKey, '100.00');
if (!isValid) {
  // Show error
}
```

### 2. Validate Balance (Detailed)

```typescript
const result = await validateUSDCBalance(publicKey, '100.00');
if (!result.isValid) {
  console.log(result.message); // "Insufficient USDC balance. You need 50.00 more USDC."
  console.log(result.shortfall); // "50.00"
}
```

### 3. Pre-Transaction Validation

```typescript
const validation = await preTransactionValidation(
  publicKey,
  amount,
  'funding' // or 'bid', 'escrow', 'payment'
);

if (!validation.canProceed) {
  // Show error
  return;
}

// Show warnings even if valid
if (validation.warnings) {
  // Display warnings
}

// Proceed with transaction
```

### 4. Format USDC

```typescript
formatUSDC(1234.56)                    // "$1,234.56 USDC"
formatUSDC(1234.56, { showSymbol: false }) // "1,234.56"
formatUSDC(1234.56, { decimals: 4 })      // "$1,234.5679 USDC"
```

## UI Components

### BalanceValidationAlert

```tsx
<BalanceValidationAlert 
  validationResult={validationResult}
  showDetails={true}
/>
```

### BalanceDisplay

```tsx
<BalanceDisplay 
  available={usdcBalance}
  required={amount}
/>
```

### TransactionWarnings

```tsx
<TransactionWarnings warnings={validation.warnings} />
```

## Common Patterns

### Pattern 1: Real-Time Balance Check

```typescript
const [balanceValidation, setBalanceValidation] = useState(null);

useEffect(() => {
  const checkBalance = async () => {
    if (amount && publicKey) {
      const validation = await preTransactionValidation(
        publicKey,
        amount,
        'funding'
      );
      setBalanceValidation(validation);
    }
  };

  const debounce = setTimeout(checkBalance, 500);
  return () => clearTimeout(debounce);
}, [amount, publicKey]);
```

### Pattern 2: Submit Handler with Validation

```typescript
const handleSubmit = async () => {
  // Validate balance
  const validation = await preTransactionValidation(
    publicKey,
    amount,
    'bid'
  );

  if (!validation.canProceed) {
    setError('Insufficient USDC balance');
    return;
  }

  // Proceed with transaction
  await submitTransaction();
};
```

### Pattern 3: Complete Form with Validation

```tsx
<form onSubmit={handleSubmit}>
  {/* Validation Alert */}
  {balanceValidation && !balanceValidation.canProceed && (
    <BalanceValidationAlert 
      validationResult={balanceValidation.validationResult}
      showDetails={true}
    />
  )}

  {/* Warnings */}
  {balanceValidation?.warnings && (
    <TransactionWarnings warnings={balanceValidation.warnings} />
  )}

  {/* Amount Input */}
  <Input 
    type="number"
    value={amount}
    onChange={(e) => setAmount(e.target.value)}
  />

  {/* Balance Display */}
  {amount && usdcBalance && (
    <BalanceDisplay 
      available={usdcBalance}
      required={amount}
    />
  )}

  {/* Submit Button */}
  <Button 
    type="submit"
    disabled={!balanceValidation?.canProceed}
  >
    Submit
  </Button>
</form>
```

## Transaction Types

| Type | Description | Warnings |
|------|-------------|----------|
| `funding` | Project funding | Escrow lock-up warning |
| `bid` | Bid submission | Maintain balance for completion |
| `escrow` | Escrow creation | Withdrawal restrictions |
| `payment` | General payment | Standard payment warnings |

## Validation Result Structure

```typescript
interface BalanceValidationResult {
  isValid: boolean;        // Can proceed with transaction
  available: string;       // Available USDC balance
  required: string;        // Required USDC amount
  shortfall?: string;      // Amount short (if insufficient)
  message?: string;        // User-friendly message
  needsDeposit: boolean;   // Should show deposit link
}
```

## Pre-Transaction Validation Result

```typescript
interface PreTransactionValidation {
  canProceed: boolean;                    // Can proceed
  validationResult: BalanceValidationResult; // Detailed result
  warnings?: string[];                    // Transaction warnings
}
```

## Error Handling

```typescript
try {
  const validation = await validateUSDCBalance(publicKey, amount);
  // Handle validation
} catch (error) {
  // Network error or other issue
  console.error('Balance check failed:', error);
  // Show generic error to user
}
```

## Best Practices

✅ **DO**: Always validate before transactions
✅ **DO**: Use debouncing for real-time checks (500ms)
✅ **DO**: Show balance display in payment modals
✅ **DO**: Display warnings even when balance is sufficient
✅ **DO**: Link to deposit page when insufficient

❌ **DON'T**: Skip validation to "save time"
❌ **DON'T**: Check balance on every keystroke
❌ **DON'T**: Show generic "insufficient balance" errors
❌ **DON'T**: Hide available balance from users
❌ **DON'T**: Forget to handle network errors

## Testing

```typescript
// Mock for tests
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

## Need Help?

- See `BALANCE_VALIDATION_USAGE.md` for detailed examples
- See `BALANCE_VALIDATION_IMPLEMENTATION.md` for implementation details
- Check existing components for reference implementations
