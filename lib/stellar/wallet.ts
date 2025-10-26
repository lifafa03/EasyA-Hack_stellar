/**
 * Stellar Wallet Integration
 * Supports Freighter, Albedo, and other Stellar wallets
 * Handles connection, signing, and transaction submission
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { isConnected, getAddress, signTransaction, requestAccess } from '@stellar/freighter-api';
import { getNetworkConfig } from './config';

export type WalletType = 'freighter' | 'albedo' | 'lobstr' | 'xbull';

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  walletType: WalletType | null;
  balance: string | null;
  usdcBalance: string | null;
}

/**
 * Connect to Freighter wallet
 */
export const connectFreighter = async (): Promise<string> => {
  try {
    // Check if Freighter is installed
    const { isConnected: connected } = await isConnected();
    if (!connected) {
      throw new Error('Freighter wallet not installed. Please install from https://freighter.app');
    }

    // Request access and get address
    const { address, error } = await requestAccess();
    
    if (error) {
      throw new Error(`Freighter error: ${error}`);
    }

    if (!address) {
      throw new Error('Failed to get address from Freighter');
    }

    return address;
  } catch (error) {
    console.error('Freighter connection error:', error);
    throw error;
  }
};

/**
 * Connect to Albedo wallet
 */
export const connectAlbedo = async (): Promise<string> => {
  try {
    // @ts-ignore - Albedo is loaded from external script
    if (!window.albedo) {
      throw new Error('Albedo wallet not found. Please install from https://albedo.link');
    }

    // @ts-ignore
    const result = await window.albedo.publicKey({});
    return result.pubkey;
  } catch (error) {
    console.error('Albedo connection error:', error);
    throw error;
  }
};

/**
 * Connect to Lobstr wallet
 */
export const connectLobstr = async (): Promise<string> => {
  try {
    // Try different possible Lobstr APIs
    // @ts-ignore
    const lobstrAPI = window.lobstr || window.lobstrWallet || (window.stellar && window.stellar.lobstr);
    
    if (!lobstrAPI) {
      throw new Error('Lobstr wallet not found. Please install the Lobstr extension from Chrome Web Store');
    }

    // Try to get public key - Lobstr might use different methods
    let publicKey: string | null = null;
    
    // Method 1: connect()
    if (typeof lobstrAPI.connect === 'function') {
      const result = await lobstrAPI.connect();
      publicKey = result?.publicKey || result?.address || result;
    }
    // Method 2: getPublicKey()
    else if (typeof lobstrAPI.getPublicKey === 'function') {
      publicKey = await lobstrAPI.getPublicKey();
    }
    // Method 3: requestAccess() (similar to Freighter)
    else if (typeof lobstrAPI.requestAccess === 'function') {
      const result = await lobstrAPI.requestAccess();
      publicKey = result?.publicKey || result?.address;
    }
    
    if (!publicKey || typeof publicKey !== 'string') {
      throw new Error('Failed to get public key from Lobstr wallet');
    }
    
    return publicKey;
  } catch (error) {
    console.error('Lobstr connection error:', error);
    throw error;
  }
};

/**
 * Connect to xBull wallet
 */
export const connectXBull = async (): Promise<string> => {
  try {
    // @ts-ignore
    if (!window.xBullSDK) {
      throw new Error('xBull wallet not found. Please install from https://xbull.app');
    }

    // @ts-ignore
    const result = await window.xBullSDK.connect();
    
    if (!result.publicKey) {
      throw new Error('Failed to get public key from xBull');
    }

    return result.publicKey;
  } catch (error) {
    console.error('xBull connection error:', error);
    throw error;
  }
};

/**
 * Generic wallet connection handler
 */
export const connectWallet = async (walletType: WalletType = 'freighter'): Promise<string> => {
  switch (walletType) {
    case 'freighter':
      return await connectFreighter();
    case 'albedo':
      return await connectAlbedo();
    case 'lobstr':
      return await connectLobstr();
    case 'xbull':
      return await connectXBull();
    default:
      throw new Error(`Wallet type ${walletType} not supported`);
  }
};

/**
 * Get account balance from Stellar network
 */
export const getAccountBalance = async (publicKey: string): Promise<{ xlm: string; usdc: string }> => {
  try {
    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);
    
    const account = await server.loadAccount(publicKey);
    
    let xlmBalance = '0';
    let usdcBalance = '0';

    account.balances.forEach((balance) => {
      if (balance.asset_type === 'native') {
        xlmBalance = balance.balance;
      } else if (
        'asset_code' in balance &&
        balance.asset_code === process.env.NEXT_PUBLIC_USDC_ASSET_CODE
      ) {
        usdcBalance = balance.balance;
      }
    });

    return { xlm: xlmBalance, usdc: usdcBalance };
  } catch (error) {
    console.error('Error fetching balance:', error);
    throw error;
  }
};

/**
 * Sign and submit transaction using Freighter
 */
export const signAndSubmitTransaction = async (
  transaction: StellarSdk.Transaction,
  walletType: WalletType = 'freighter'
): Promise<StellarSdk.Horizon.HorizonApi.SubmitTransactionResponse> => {
  try {
    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);

    let signedXdr: string;

    if (walletType === 'freighter') {
      // Sign with Freighter
      const { signedTxXdr, error } = await signTransaction(transaction.toXDR(), {
        networkPassphrase: config.networkPassphrase,
      });
      
      if (error) {
        throw new Error(`Freighter signing error: ${error}`);
      }
      
      signedXdr = signedTxXdr;
    } else if (walletType === 'albedo') {
      // @ts-ignore
      const result = await window.albedo.tx({
        xdr: transaction.toXDR(),
        network: config.network,
      });
      signedXdr = result.signed_envelope_xdr;
    } else if (walletType === 'lobstr') {
      // @ts-ignore
      const result = await window.lobstr.signTransaction({
        xdr: transaction.toXDR(),
        networkPassphrase: config.networkPassphrase,
      });
      signedXdr = result.signedXDR;
    } else if (walletType === 'xbull') {
      // @ts-ignore
      const network = config.networkPassphrase.includes('Test') ? 'TESTNET' : 'PUBLIC';
      // @ts-ignore
      const result = await window.xBullSDK.sign({
        xdr: transaction.toXDR(),
        publicKey: transaction.source,
        network,
      });
      signedXdr = result.response;
    } else {
      throw new Error(`Signing not supported for wallet type: ${walletType}`);
    }

    // Submit transaction
    const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      config.networkPassphrase
    );
    
    const result = await server.submitTransaction(signedTransaction);
    return result;
  } catch (error) {
    console.error('Transaction signing/submission error:', error);
    throw error;
  }
};

/**
 * Create a payment operation
 */
export const createPaymentOperation = async (
  sourcePublicKey: string,
  destinationPublicKey: string,
  amount: string,
  assetCode: string = 'XLM',
  assetIssuer?: string
): Promise<StellarSdk.Transaction> => {
  try {
    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);
    
    const sourceAccount = await server.loadAccount(sourcePublicKey);
    
    const asset = assetCode === 'XLM' 
      ? StellarSdk.Asset.native()
      : new StellarSdk.Asset(assetCode, assetIssuer!);

    const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: destinationPublicKey,
          asset: asset,
          amount: amount,
        })
      )
      .setTimeout(180)
      .build();

    return transaction;
  } catch (error) {
    console.error('Error creating payment:', error);
    throw error;
  }
};

/**
 * Check if wallet is connected
 */
export const checkWalletConnection = async (): Promise<boolean> => {
  try {
    const { isConnected: connected } = await isConnected();
    return connected;
  } catch {
    return false;
  }
};

/**
 * Check if a specific wallet is available
 */
export const isWalletAvailable = (walletType: WalletType): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    switch (walletType) {
      case 'freighter':
        // Freighter injects itself into window
        return 'freighter' in window;
      case 'albedo':
        // @ts-ignore
        return window.albedo !== undefined;
      case 'lobstr':
        // Lobstr extension might inject as 'lobstrWallet' or check for the extension
        // @ts-ignore
        return window.lobstr !== undefined || window.lobstrWallet !== undefined || 
               // @ts-ignore
               (window.stellar && window.stellar.lobstr !== undefined);
      case 'xbull':
        // @ts-ignore
        return window.xBullSDK !== undefined && typeof window.xBullSDK.isAvailable === 'function' && window.xBullSDK.isAvailable();
      default:
        return false;
    }
  } catch (error) {
    console.error(`Error checking ${walletType} availability:`, error);
    return false;
  }
};

/**
 * Get all available wallets
 */
export const getAvailableWallets = (): WalletType[] => {
  const wallets: WalletType[] = [];
  
  if (isWalletAvailable('freighter')) wallets.push('freighter');
  if (isWalletAvailable('albedo')) wallets.push('albedo');
  if (isWalletAvailable('lobstr')) wallets.push('lobstr');
  if (isWalletAvailable('xbull')) wallets.push('xbull');
  
  return wallets;
};

/**
 * Debug function to check what wallet APIs are available
 */
export const debugWalletAPIs = (): void => {
  if (typeof window === 'undefined') {
    console.log('Window is undefined (SSR)');
    return;
  }
  
  console.log('=== Wallet API Debug ===');
  // @ts-ignore
  console.log('window.freighter:', typeof window.freighter, window.freighter);
  // @ts-ignore
  console.log('window.albedo:', typeof window.albedo, window.albedo);
  // @ts-ignore
  console.log('window.lobstr:', typeof window.lobstr, window.lobstr);
  // @ts-ignore
  console.log('window.lobstrWallet:', typeof window.lobstrWallet, window.lobstrWallet);
  // @ts-ignore
  console.log('window.xBullSDK:', typeof window.xBullSDK, window.xBullSDK);
  // @ts-ignore
  console.log('window.stellar:', typeof window.stellar, window.stellar);
  console.log('=======================');
};

/**
 * Disconnect wallet (clear local state)
 */
export const disconnectWallet = (): void => {
  // Clear any stored wallet data
  if (typeof window !== 'undefined') {
    localStorage.removeItem('stellar_wallet_type');
    localStorage.removeItem('stellar_public_key');
  }
};
