# Stellar Wallet Service

A unified wallet integration service for Stellar blockchain, supporting multiple wallet providers.

## Supported Wallets

- **Freighter** - Browser extension wallet (Recommended)
- **Lobstr** - Mobile and web wallet with WalletConnect
- **Albedo** - Web-based wallet
- **xBull** - Browser extension wallet

## Usage

### Basic Setup

```typescript
import { getWalletService, WalletType } from '@/lib/stellar/wallet';

// Get the wallet service instance
const walletService = getWalletService();

// Connect to a wallet
try {
  const connection = await walletService.connect(WalletType.FREIGHTER);
  console.log('Connected:', connection.publicKey);
} catch (error) {
  console.error('Connection failed:', error);
}
```

### Check Available Wallets

```typescript
// Get list of installed/available wallets
const availableWallets = await walletService.getAvailableWallets();
console.log('Available wallets:', availableWallets);
```

### Sign Transactions

```typescript
import * as StellarSdk from '@stellar/stellar-sdk';
import { getNetworkConfig } from '@/lib/stellar/config';

const config = getNetworkConfig();

// Build a transaction
const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
  fee: StellarSdk.BASE_FEE,
  networkPassphrase: config.networkPassphrase,
})
  .addOperation(/* ... */)
  .setTimeout(180)
  .build();

// Sign with connected wallet
try {
  const signedXdr = await walletService.signTransaction(
    transaction,
    config.networkPassphrase
  );
  
  // Submit to network
  const signedTx = StellarSdk.TransactionBuilder.fromXDR(
    signedXdr,
    config.networkPassphrase
  );
  const result = await server.submitTransaction(signedTx);
} catch (error) {
  console.error('Transaction failed:', error);
}
```

### Listen to Wallet Events

```typescript
import { WalletEventType } from '@/lib/stellar/wallet';

// Subscribe to wallet events
const unsubscribe = walletService.on((event) => {
  switch (event.type) {
    case WalletEventType.CONNECTED:
      console.log('Wallet connected:', event.data);
      break;
    case WalletEventType.DISCONNECTED:
      console.log('Wallet disconnected');
      break;
    case WalletEventType.ACCOUNT_CHANGED:
      console.log('Account changed:', event.data);
      break;
  }
});

// Unsubscribe when done
unsubscribe();
```

### Disconnect Wallet

```typescript
await walletService.disconnect();
```

### Restore Previous Connection

```typescript
// Automatically restore connection on app load
const restored = await walletService.restoreConnection();
if (restored) {
  console.log('Connection restored');
}
```

## Error Handling

The wallet service uses a custom `WalletError` class with specific error codes:

```typescript
import { WalletError, WalletErrorCode } from '@/lib/stellar/wallet';

try {
  await walletService.connect(WalletType.FREIGHTER);
} catch (error) {
  if (error instanceof WalletError) {
    switch (error.code) {
      case WalletErrorCode.NOT_INSTALLED:
        console.error('Wallet not installed');
        break;
      case WalletErrorCode.USER_REJECTED:
        console.error('User rejected the request');
        break;
      case WalletErrorCode.CONNECTION_FAILED:
        console.error('Connection failed');
        break;
      case WalletErrorCode.SIGNING_FAILED:
        console.error('Transaction signing failed');
        break;
      case WalletErrorCode.NOT_CONNECTED:
        console.error('No wallet connected');
        break;
    }
  }
}
```

## React Integration

Use with the existing `useWallet` hook:

```typescript
import { useWallet } from '@/hooks/use-wallet';

function MyComponent() {
  const wallet = useWallet();

  const handleConnect = async () => {
    await wallet.connect('freighter');
  };

  return (
    <div>
      {wallet.connected ? (
        <p>Connected: {wallet.publicKey}</p>
      ) : (
        <button onClick={handleConnect}>Connect Wallet</button>
      )}
    </div>
  );
}
```

## Architecture

### WalletProvider Interface

All wallet implementations conform to the `WalletProvider` interface:

```typescript
interface WalletProvider {
  connect(): Promise<string>;
  disconnect(): Promise<void>;
  signTransaction(transaction: Transaction, networkPassphrase: string): Promise<string>;
  getPublicKey(): string | null;
  isAvailable(): Promise<boolean>;
  getWalletType(): WalletType;
}
```

### WalletService

The `WalletService` class manages:
- Provider registration and discovery
- Connection state management
- Event emission for state changes
- Connection persistence (localStorage)
- Unified error handling

## Dependencies

- `@stellar/stellar-sdk` - Stellar SDK for transaction handling
- `@stellar/freighter-api` - Freighter wallet integration
- `@creit.tech/stellar-wallets-kit` - (Optional) For Lobstr WalletConnect support

## Notes

- Wallet connections are persisted in localStorage and automatically restored on page load
- All wallet operations are async and may require user approval
- Transaction signing always requires explicit user confirmation
- Some wallets (Albedo, xBull) may load their SDKs dynamically
