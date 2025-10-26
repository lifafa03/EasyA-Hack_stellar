/**
 * Example usage of the Wallet Service
 * This file demonstrates how to use the wallet integration
 */

import { getWalletService, WalletType, WalletEventType, WalletError, WalletErrorCode } from './index';
import * as StellarSdk from '@stellar/stellar-sdk';

/**
 * Example: Connect to a wallet
 */
export async function connectWalletExample() {
  const walletService = getWalletService();

  try {
    // Get available wallets
    const availableWallets = await walletService.getAvailableWallets();
    console.log('Available wallets:', availableWallets);

    // Connect to Freighter (or any other wallet)
    const connection = await walletService.connect(WalletType.FREIGHTER);
    console.log('Connected to wallet:', connection.publicKey);
    console.log('Wallet type:', connection.walletType);
    console.log('Connected at:', connection.connectedAt);

    return connection;
  } catch (error) {
    if (error instanceof WalletError) {
      switch (error.code) {
        case WalletErrorCode.NOT_INSTALLED:
          console.error('Wallet not installed. Please install it first.');
          break;
        case WalletErrorCode.USER_REJECTED:
          console.error('User rejected the connection request.');
          break;
        case WalletErrorCode.CONNECTION_FAILED:
          console.error('Failed to connect to wallet:', error.message);
          break;
        default:
          console.error('Wallet error:', error.message);
      }
    } else {
      console.error('Unexpected error:', error);
    }
    throw error;
  }
}

/**
 * Example: Sign and submit a transaction
 */
export async function signTransactionExample(
  destinationAddress: string,
  amount: string
) {
  const walletService = getWalletService();

  // Check if wallet is connected
  if (!walletService.isConnected()) {
    throw new Error('Please connect your wallet first');
  }

  const publicKey = walletService.getPublicKey();
  if (!publicKey) {
    throw new Error('No public key available');
  }

  try {
    // Create a Stellar server instance
    const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
    const networkPassphrase = StellarSdk.Networks.TESTNET;

    // Load the source account
    const sourceAccount = await server.loadAccount(publicKey);

    // Build a payment transaction
    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: destinationAddress,
          asset: StellarSdk.Asset.native(),
          amount: amount,
        })
      )
      .setTimeout(180)
      .build();

    console.log('Transaction built, requesting signature...');

    // Sign the transaction with the connected wallet
    const signedXdr = await walletService.signTransaction(transaction, networkPassphrase);

    console.log('Transaction signed successfully');

    // Reconstruct the signed transaction
    const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      networkPassphrase
    );

    // Submit to the network
    const result = await server.submitTransaction(signedTransaction);

    console.log('Transaction submitted successfully!');
    console.log('Transaction hash:', result.hash);

    return result;
  } catch (error) {
    if (error instanceof WalletError) {
      switch (error.code) {
        case WalletErrorCode.USER_REJECTED:
          console.error('User rejected the transaction');
          break;
        case WalletErrorCode.SIGNING_FAILED:
          console.error('Failed to sign transaction:', error.message);
          break;
        case WalletErrorCode.NOT_CONNECTED:
          console.error('Wallet not connected');
          break;
        default:
          console.error('Wallet error:', error.message);
      }
    } else {
      console.error('Transaction error:', error);
    }
    throw error;
  }
}

/**
 * Example: Listen to wallet events
 */
export function setupWalletEventListeners() {
  const walletService = getWalletService();

  const unsubscribe = walletService.on((event) => {
    switch (event.type) {
      case WalletEventType.CONNECTED:
        console.log('Wallet connected:', event.data);
        // Update UI, fetch balances, etc.
        break;

      case WalletEventType.DISCONNECTED:
        console.log('Wallet disconnected');
        // Clear UI state, redirect to home, etc.
        break;

      case WalletEventType.ACCOUNT_CHANGED:
        console.log('Account changed:', event.data);
        // Refresh balances, update UI, etc.
        break;
    }
  });

  // Return unsubscribe function to clean up when component unmounts
  return unsubscribe;
}

/**
 * Example: Disconnect wallet
 */
export async function disconnectWalletExample() {
  const walletService = getWalletService();

  try {
    await walletService.disconnect();
    console.log('Wallet disconnected successfully');
  } catch (error) {
    console.error('Error disconnecting wallet:', error);
  }
}

/**
 * Example: Restore previous connection on app load
 */
export async function restoreConnectionExample() {
  const walletService = getWalletService();

  try {
    const restored = await walletService.restoreConnection();

    if (restored) {
      console.log('Previous wallet connection restored');
      const state = walletService.getState();
      console.log('Connected wallet:', state.walletType);
      console.log('Public key:', state.publicKey);
      return true;
    } else {
      console.log('No previous connection to restore');
      return false;
    }
  } catch (error) {
    console.error('Failed to restore connection:', error);
    return false;
  }
}

/**
 * Example: Check wallet state
 */
export function checkWalletStateExample() {
  const walletService = getWalletService();

  const state = walletService.getState();

  console.log('Wallet state:', {
    connected: state.connected,
    publicKey: state.publicKey,
    walletType: state.walletType,
  });

  // Individual checks
  console.log('Is connected:', walletService.isConnected());
  console.log('Public key:', walletService.getPublicKey());
  console.log('Wallet type:', walletService.getWalletType());

  return state;
}

/**
 * Example: Complete wallet flow
 */
export async function completeWalletFlowExample() {
  console.log('=== Starting Complete Wallet Flow ===');

  // 1. Restore previous connection if available
  await restoreConnectionExample();

  // 2. If not connected, connect to a wallet
  if (!getWalletService().isConnected()) {
    await connectWalletExample();
  }

  // 3. Set up event listeners
  const unsubscribe = setupWalletEventListeners();

  // 4. Check current state
  checkWalletStateExample();

  // 5. Sign a transaction (example)
  // await signTransactionExample('DESTINATION_ADDRESS', '10');

  // 6. When done, disconnect
  // await disconnectWalletExample();

  // 7. Clean up event listeners
  // unsubscribe();

  console.log('=== Wallet Flow Complete ===');

  return unsubscribe;
}
