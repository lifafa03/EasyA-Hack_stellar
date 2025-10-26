# Stellar SDK Integration

This directory contains the Stellar blockchain integration for the marketplace platform, including Soroban smart contract interactions.

## Structure

```
lib/stellar/
├── index.ts          # Main entry point, exports all modules
├── types.ts          # TypeScript types and interfaces
├── config.ts         # Network configuration (testnet/mainnet)
├── sdk.ts            # Base SDK wrapper class
├── utils.ts          # Utility functions and error handling
└── services/         # Service layer (to be implemented)
    ├── wallet.ts     # Wallet connection service
    ├── escrow.ts     # Escrow contract service
    ├── crowdfunding.ts # Crowdfunding pool service
    └── anchor.ts     # Fiat on/off-ramp service
```

## Installation

The required packages are already installed:
- `@stellar/stellar-sdk` - Official Stellar SDK
- `soroban-client` - Soroban smart contract client (deprecated, functionality moved to stellar-sdk)

## Configuration

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Network selection
NEXT_PUBLIC_STELLAR_NETWORK=testnet  # or 'mainnet'

# API endpoints
NEXT_PUBLIC_STELLAR_HORIZON_URL=https://horizon-testnet.stellar.org
NEXT_PUBLIC_STELLAR_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org

# Contract addresses (set after deployment)
NEXT_PUBLIC_ESCROW_CONTRACT_ID=
NEXT_PUBLIC_POOL_CONTRACT_ID=
NEXT_PUBLIC_P2P_CONTRACT_ID=

# Anchor configuration
NEXT_PUBLIC_ANCHOR_DOMAIN=testanchor.stellar.org
```

### Network Configuration

The SDK supports both testnet and mainnet:

```typescript
import { getStellarConfig } from '@/lib/stellar';

const config = getStellarConfig(); // Reads from environment
```

## Usage

### Initialize SDK

```typescript
import { StellarSDK, getStellarSDK } from '@/lib/stellar';

// Get singleton instance
const sdk = getStellarSDK();

// Or create custom instance
const customSdk = new StellarSDK({
  network: 'testnet',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  sorobanRpcUrl: 'https://soroban-testnet.stellar.org',
  networkPassphrase: Networks.TESTNET,
  contractIds: {},
});
```

### Build and Submit Transactions

```typescript
import { Operation } from '@stellar/stellar-sdk';

// Build transaction
const operations = [
  // Your operations here
];

const transaction = await sdk.buildTransaction(
  sourcePublicKey,
  operations,
  { fee: '10000', timeout: 180 }
);

// Submit transaction
const result = await sdk.submitTransaction(transaction);
console.log('Transaction hash:', result.hash);
```

### Get Account Information

```typescript
// Get account details
const account = await sdk.getAccount(publicKey);

// Get XLM balance
const balance = await sdk.getBalance(publicKey);
console.log('Balance:', balance, 'XLM');
```

### Subscribe to Contract Events

```typescript
const subscription = sdk.subscribeToContractEvents(
  contractId,
  (event) => {
    console.log('Contract event:', event);
  }
);

// Unsubscribe when done
subscription.unsubscribe();
```

## Error Handling

The SDK uses custom error types for better error handling:

```typescript
import { StellarError, ErrorCode, handleStellarError } from '@/lib/stellar';

try {
  await sdk.submitTransaction(transaction);
} catch (error) {
  if (error instanceof StellarError) {
    const userMessage = handleStellarError(error);
    console.error(userMessage.title, userMessage.message);
  }
}
```

## Utility Functions

```typescript
import {
  formatAddress,
  isValidPublicKey,
  stroopsToXlm,
  xlmToStroops,
  formatAmount,
  getStellarExpertUrl,
} from '@/lib/stellar/utils';

// Format address for display
const short = formatAddress('GXXXXXXX...'); // "GXXXXX...XXXX"

// Validate public key
const valid = isValidPublicKey(publicKey);

// Convert amounts
const xlm = stroopsToXlm('10000000'); // "1.0000000"
const stroops = xlmToStroops('1.5'); // "15000000"

// Get explorer URL
const url = getStellarExpertUrl(txHash, 'testnet');
```

## Next Steps

1. Implement wallet service for connecting to Stellar wallets (Lobstr, Freighter, Albedo, xBull)
2. Implement escrow service for smart contract interactions
3. Implement crowdfunding service for pool management
4. Implement anchor service for fiat on/off-ramping
5. Create React components for UI integration

## Resources

- [Stellar Documentation](https://developers.stellar.org/)
- [Soroban Documentation](https://soroban.stellar.org/)
- [Stellar SDK Reference](https://stellar.github.io/js-stellar-sdk/)
- [Stellar Expert Explorer](https://stellar.expert/)
