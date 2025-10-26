# Stellar Services

This directory contains service layer implementations for interacting with Stellar smart contracts and anchors.

## Services

### EscrowService (`escrow.ts`)
Handles escrow contract interactions including:
- Creating escrow contracts with milestone-based or time-based releases
- Completing milestones and releasing funds
- Querying escrow status
- Withdrawing released funds
- Initiating disputes
- Real-time monitoring via `watchEscrow()`

**Usage:**
```typescript
import { StellarSDK } from '../sdk';
import { EscrowService } from './escrow';

const sdk = new StellarSDK();
const escrowService = new EscrowService(sdk);

// Create escrow
const contractId = await escrowService.createEscrow({
  provider: 'PROVIDER_PUBLIC_KEY',
  totalAmount: '1000',
  releaseType: 'milestone-based',
  milestones: [
    { id: 1, description: 'Design phase', amount: '300' },
    { id: 2, description: 'Development phase', amount: '700' }
  ]
}, signer);

// Complete milestone
await escrowService.completeMilestone(contractId, 1, signer);

// Watch for updates
escrowService.watchEscrow(contractId).subscribe(event => {
  console.log('Escrow event:', event);
});
```

### CrowdfundingService (`crowdfunding.ts`)
Handles crowdfunding pool contract interactions including:
- Creating crowdfunding pools
- Contributing to pools
- Finalizing pools when goal is met
- Requesting refunds for failed pools
- Querying pool information
- Real-time monitoring via `watchPool()`

**Usage:**
```typescript
import { CrowdfundingService } from './crowdfunding';

const crowdfundingService = new CrowdfundingService(sdk);

// Create pool
const poolId = await crowdfundingService.createPool({
  fundingGoal: '10000',
  deadline: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
  projectDescription: 'Build a decentralized marketplace'
}, signer);

// Contribute to pool
await crowdfundingService.contribute(poolId, '500', signer);

// Get pool info
const poolInfo = await crowdfundingService.getPoolInfo(poolId);
console.log('Pool status:', poolInfo.status);
```

### AnchorService (`anchor.ts`)
Handles fiat on/off-ramping through SEP-24 compliant anchors:
- Converting fiat to crypto (on-ramp)
- Converting crypto to fiat (off-ramp)
- Getting exchange rates
- Tracking transaction status
- Interactive deposit/withdrawal flows

**Usage:**
```typescript
import { AnchorService } from './anchor';

const anchorService = new AnchorService('testanchor.stellar.org');

// On-ramp (fiat to crypto)
const onRampSession = await anchorService.onRamp({
  amount: '100',
  currency: 'USD',
  destinationAddress: 'USER_PUBLIC_KEY',
  paymentMethod: 'bank_transfer'
});

// Open interactive flow
window.open(onRampSession.url, '_blank');

// Check status
const status = await anchorService.getTransactionStatus(onRampSession.id);

// Get exchange rate
const rate = await anchorService.getExchangeRate('USD', 'USDC');
console.log('Exchange rate:', rate.rate);
```

## Architecture

All services follow a consistent pattern:
1. **Dependency Injection**: Services receive `StellarSDK` instance in constructor
2. **Parameter Validation**: All methods validate input parameters before execution
3. **Error Handling**: Custom `StellarError` with specific error codes
4. **Real-time Updates**: Observable-based event streaming for contract monitoring
5. **Type Safety**: Full TypeScript type definitions for all parameters and return values

## Error Handling

Services throw `StellarError` with specific error codes:
- `NETWORK_ERROR`: Network connectivity issues
- `CONTRACT_ERROR`: Smart contract execution errors
- `WALLET_ERROR`: Wallet signing or connection errors
- `ANCHOR_ERROR`: Anchor service errors
- `INVALID_PARAMS`: Invalid input parameters
- `INSUFFICIENT_FUNDS`: Insufficient balance
- `UNAUTHORIZED`: Unauthorized access attempt

## Real-time Monitoring

Services provide Observable-based monitoring:
```typescript
// Subscribe to escrow events
const subscription = escrowService.watchEscrow(contractId).subscribe({
  next: (event) => console.log('Event:', event),
  error: (error) => console.error('Error:', error),
  complete: () => console.log('Stream closed')
});

// Unsubscribe when done
subscription.unsubscribe();
```

## Requirements Coverage

- **Requirement 6.1-6.7**: Base StellarSDK class with transaction building and submission
- **Requirement 1.1-1.5, 2.1-2.5**: EscrowService for escrow contract management
- **Requirement 3.1-3.5**: CrowdfundingService for pool management
- **Requirement 5.1-5.6**: AnchorService for fiat on/off-ramping
- **Requirement 9.1-9.5**: Real-time event monitoring and updates
