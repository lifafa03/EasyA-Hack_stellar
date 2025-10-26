/**
 * Stellar Wallet Integration
 * Supports Freighter, Albedo, and other Stellar wallets
 * Handles connection, signing, and transaction submission
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { isConnected, getAddress, signTransaction, requestAccess } from '@stellar/freighter-api';
import { getNetworkConfig } from './config';

export type WalletType = 'freighter' | 'albedo' | 'rabet';

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
 * Generic wallet connection handler
 */
export const connectWallet = async (walletType: WalletType = 'freighter'): Promise<string> => {
  switch (walletType) {
    case 'freighter':
      return await connectFreighter();
    case 'albedo':
      return await connectAlbedo();
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
    
    console.log('🔍 Fetching balance for:', publicKey);
    const account = await server.loadAccount(publicKey);
    
    let xlmBalance = '0';
    let usdcBalance = '0';

    console.log('📊 All balances:', account.balances);

    account.balances.forEach((balance) => {
      if (balance.asset_type === 'native') {
        xlmBalance = balance.balance;
        console.log('💰 XLM Balance:', xlmBalance);
      } else if (
        'asset_code' in balance &&
        balance.asset_code === 'USDC'
      ) {
        usdcBalance = balance.balance;
        console.log('💵 USDC Balance:', usdcBalance, 'Issuer:', 'asset_issuer' in balance ? balance.asset_issuer : 'N/A');
      }
    });

    console.log('✅ Final balances - XLM:', xlmBalance, 'USDC:', usdcBalance);
    return { xlm: xlmBalance, usdc: usdcBalance };
  } catch (error) {
    console.error('❌ Error fetching balance:', error);
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
 * Disconnect wallet (clear local state)
 */
export const disconnectWallet = (): void => {
  // Clear any stored wallet data
  if (typeof window !== 'undefined') {
    localStorage.removeItem('stellar_wallet_type');
    localStorage.removeItem('stellar_public_key');
  }
};
