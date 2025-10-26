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
 * Automatically funds account via Friendbot if it doesn't exist on testnet
 */
export const getAccountBalance = async (publicKey: string): Promise<{ xlm: string; usdc: string }> => {
  try {
    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);
    
    console.log('🔍 Fetching balance for:', publicKey);
    
    let account;
    try {
      account = await server.loadAccount(publicKey);
    } catch (error: any) {
      // If account doesn't exist on testnet, fund it via Friendbot
      if (error?.response?.status === 404 && config.network === 'TESTNET') {
        console.log('🆕 Account not found on testnet, funding via Friendbot...');
        await fundAccountViaFriendbot(publicKey);
        
        // Wait a bit for the transaction to be confirmed
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Try loading account again
        account = await server.loadAccount(publicKey);
        console.log('✅ Account funded and activated!');
      } else {
        throw error;
      }
    }
    
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
 * Fund account via Stellar Friendbot (Testnet only)
 */
export const fundAccountViaFriendbot = async (publicKey: string): Promise<void> => {
  try {
    const config = getNetworkConfig();
    
    if (config.network !== 'TESTNET') {
      throw new Error('Friendbot is only available on testnet');
    }

    console.log('💰 Requesting testnet XLM from Friendbot for:', publicKey);
    
    const response = await fetch(
      `https://friendbot.stellar.org?addr=${encodeURIComponent(publicKey)}`
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Friendbot funding failed: ${errorText}`);
    }

    const responseJSON = await response.json();
    console.log('✅ Friendbot response:', responseJSON);
    console.log('🎉 Account funded with 10,000 XLM testnet tokens!');
    
  } catch (error) {
    console.error('❌ Friendbot error:', error);
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
      throw new Error(`Wallet type ${walletType} not supported for signing`);
    }

    // Submit transaction
    const transactionToSubmit = StellarSdk.TransactionBuilder.fromXDR(
      signedXdr,
      config.networkPassphrase
    );

    console.log('📤 Submitting transaction to Stellar network...');
    const response = await server.submitTransaction(transactionToSubmit as StellarSdk.Transaction);
    
    console.log('✅ Transaction submitted successfully!');
    console.log('🔗 Transaction Hash:', response.hash);
    console.log('📊 Ledger:', response.ledger);
    console.log('🔍 View on Stellar Expert:', `https://stellar.expert/explorer/testnet/tx/${response.hash}`);
    
    return response;
  } catch (error) {
    console.error('❌ Transaction submission error:', error);
    throw error;
  }
};

/**
 * Check if wallet is available
 */
export const isWalletAvailable = async (walletType: WalletType): Promise<boolean> => {
  if (walletType === 'freighter') {
    try {
      const { isConnected: connected } = await isConnected();
      return connected;
    } catch {
      return false;
    }
  }
  
  if (walletType === 'albedo') {
    // @ts-ignore
    return typeof window !== 'undefined' && !!window.albedo;
  }
  
  return false;
};

/**
 * Get available wallets
 */
export const getAvailableWallets = async (): Promise<WalletType[]> => {
  const wallets: WalletType[] = [];
  
  const freighterAvailable = await isWalletAvailable('freighter');
  if (freighterAvailable) {
    wallets.push('freighter');
  }
  
  const albedoAvailable = await isWalletAvailable('albedo');
  if (albedoAvailable) {
    wallets.push('albedo');
  }
  
  return wallets;
};

/**
 * Disconnect wallet (clears local state)
 */
export const disconnectWallet = (): void => {
  // Clear any stored wallet state
  if (typeof window !== 'undefined') {
    localStorage.removeItem('walletType');
    localStorage.removeItem('publicKey');
  }
};

/**
 * Check if wallet is still connected
 */
export const checkWalletConnection = async (): Promise<boolean> => {
  try {
    const { isConnected: connected } = await isConnected();
    return connected;
  } catch {
    return false;
  }
};
