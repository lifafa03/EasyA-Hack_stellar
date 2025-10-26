/**
 * Stellar Wallet Integration
 * Uses Stellar Wallets Kit (https://stellarwalletskit.dev/) for unified wallet support
 * 
 * Benefits of Stellar Wallets Kit:
 * - Single API for all Stellar wallets (Freighter, xBull, Albedo, Lobstr, etc.)
 * - Automatic wallet detection and availability checking
 * - Consistent error handling across all wallets
 * - Built-in support for WalletConnect
 * - Maintained by the Stellar community
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { 
  StellarWalletsKit, 
  WalletNetwork, 
  ISupportedWallet, 
  FREIGHTER_ID, 
  XBULL_ID,
  FreighterModule,
  xBullModule,
  AlbedoModule,
  LobstrModule
} from '@creit.tech/stellar-wallets-kit';
import { getNetworkConfig } from './config';

export type WalletType = 'freighter' | 'albedo' | 'lobstr' | 'xbull';

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  walletType: WalletType | null;
  balance: string | null;
  usdcBalance: string | null;
}

// Singleton instance of Stellar Wallets Kit
let kit: StellarWalletsKit | null = null;

/**
 * Get or initialize the Stellar Wallets Kit instance
 * Uses singleton pattern to ensure only one instance exists
 */
const getKit = (): StellarWalletsKit => {
  if (!kit) {
    const config = getNetworkConfig();
    const network = config.network === 'TESTNET' ? WalletNetwork.TESTNET : WalletNetwork.PUBLIC;
    
    kit = new StellarWalletsKit({
      network,
      selectedWalletId: FREIGHTER_ID, // Default to Freighter
      modules: [
        new FreighterModule(),
        new xBullModule(),
        new AlbedoModule(),
        new LobstrModule(),
      ],
    });
  }
  return kit;
};

/**
 * Map wallet type to Stellar Wallets Kit ID
 */
const getWalletId = (walletType: WalletType): string => {
  const walletMap: Record<WalletType, string> = {
    freighter: FREIGHTER_ID,
    xbull: XBULL_ID,
    albedo: 'albedo',
    lobstr: 'lobstr',
  };
  return walletMap[walletType];
};

/**
 * Generic wallet connection handler using Stellar Wallets Kit
 */
export const connectWallet = async (walletType: WalletType = 'freighter'): Promise<string> => {
  try {
    const walletKit = getKit();
    const walletId = getWalletId(walletType);
    
    // Set the selected wallet
    await walletKit.setWallet(walletId);
    
    // Get the public key
    const { address } = await walletKit.getAddress();
    
    if (!address) {
      throw new Error(`Failed to get address from ${walletType} wallet`);
    }
    
    return address;
  } catch (error: any) {
    console.error(`${walletType} connection error:`, error);
    
    // Provide user-friendly error messages
    if (error.message?.includes('not installed') || error.message?.includes('not found')) {
      const walletUrls: Record<WalletType, string> = {
        freighter: 'https://freighter.app',
        albedo: 'https://albedo.link',
        lobstr: 'https://lobstr.co',
        xbull: 'https://xbull.app',
      };
      throw new Error(`${walletType.charAt(0).toUpperCase() + walletType.slice(1)} wallet not installed. Get it at ${walletUrls[walletType]}`);
    }
    
    throw error;
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
 * Sign and submit transaction using Stellar Wallets Kit
 */
export const signAndSubmitTransaction = async (
  transaction: StellarSdk.Transaction,
  walletType: WalletType = 'freighter'
): Promise<StellarSdk.Horizon.HorizonApi.SubmitTransactionResponse> => {
  try {
    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);
    const walletKit = getKit();

    // Sign transaction using Stellar Wallets Kit
    const { signedTxXdr } = await walletKit.signTransaction(transaction.toXDR(), {
      networkPassphrase: config.networkPassphrase,
    });

    // Submit transaction
    const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
      signedTxXdr,
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
    const walletKit = getKit();
    const { address } = await walletKit.getAddress();
    return !!address;
  } catch {
    return false;
  }
};

/**
 * Check if a specific wallet is available using Stellar Wallets Kit
 */
export const isWalletAvailable = (walletType: WalletType): boolean => {
  if (typeof window === 'undefined') return false;

  try {
    const walletKit = getKit();
    const walletId = getWalletId(walletType);
    const supportedWallets = walletKit.getSupportedWallets();
    
    // Check if wallet is in supported list and installed
    const wallet = supportedWallets.find((w: ISupportedWallet) => w.id === walletId);
    return wallet ? wallet.isAvailable : false;
  } catch (error) {
    console.error(`Error checking ${walletType} availability:`, error);
    return false;
  }
};

/**
 * Get all available wallets using Stellar Wallets Kit
 */
export const getAvailableWallets = (): WalletType[] => {
  try {
    const walletKit = getKit();
    const supportedWallets = walletKit.getSupportedWallets();
    
    const walletTypeMap: Record<string, WalletType> = {
      [FREIGHTER_ID]: 'freighter',
      [XBULL_ID]: 'xbull',
      'albedo': 'albedo',
      'lobstr': 'lobstr',
    };
    
    return supportedWallets
      .filter((w: ISupportedWallet) => w.isAvailable)
      .map((w: ISupportedWallet) => walletTypeMap[w.id])
      .filter((type): type is WalletType => type !== undefined);
  } catch (error) {
    console.error('Error getting available wallets:', error);
    return [];
  }
};

/**
 * Debug function to check what wallet APIs are available
 */
export const debugWalletAPIs = (): void => {
  if (typeof window === 'undefined') {
    console.log('Window is undefined (SSR)');
    return;
  }
  
  console.log('=== Wallet API Debug (Stellar Wallets Kit) ===');
  
  try {
    const walletKit = getKit();
    const supportedWallets = walletKit.getSupportedWallets();
    
    console.log('Supported wallets:', supportedWallets.map((w: ISupportedWallet) => ({
      id: w.id,
      name: w.name,
      isAvailable: w.isAvailable,
    })));
    
    console.log('Available wallets:', getAvailableWallets());
  } catch (error) {
    console.error('Error debugging wallets:', error);
  }
  
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
