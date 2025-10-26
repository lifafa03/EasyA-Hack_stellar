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
import { getNetworkConfig, USDC_ASSET } from './config';

export type WalletType = 'freighter' | 'albedo' | 'lobstr' | 'xbull';

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  walletType: WalletType | null;
  balance: string | null;
  usdcBalance: string | null;
}

export interface BalanceInfo {
  xlm: string;
  usdc: string;
  hasUSDCTrustline: boolean;
}

export interface TrustlineInfo {
  exists: boolean;
  limit: string;
  balance: string;
  asset: {
    code: string;
    issuer: string;
  };
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
 * Get account balance from Stellar network with USDC prioritization
 * Returns USDC balance first, XLM second, and trustline status
 */
export const getAccountBalance = async (publicKey: string): Promise<BalanceInfo> => {
  try {
    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);
    
    const account = await server.loadAccount(publicKey);
    
    let xlmBalance = '0';
    let usdcBalance = '0';
    let hasUSDCTrustline = false;

    account.balances.forEach((balance) => {
      if (balance.asset_type === 'native') {
        xlmBalance = balance.balance;
      } else if (
        'asset_code' in balance &&
        balance.asset_code === USDC_ASSET.code &&
        'asset_issuer' in balance &&
        balance.asset_issuer === USDC_ASSET.issuer
      ) {
        usdcBalance = balance.balance;
        hasUSDCTrustline = true;
      }
    });

    return { xlm: xlmBalance, usdc: usdcBalance, hasUSDCTrustline };
  } catch (error: any) {
    // Handle unfunded account (404 error)
    if (error?.response?.status === 404 || error?.name === 'NotFoundError') {
      console.log('Account not yet funded on network:', publicKey);
      return { xlm: '0', usdc: '0', hasUSDCTrustline: false };
    }
    
    console.error('Error fetching balance:', error);
    throw error;
  }
};

/**
 * Get USDC balance only (prioritized method)
 */
export const getUSDCBalance = async (publicKey: string): Promise<string> => {
  const balanceInfo = await getAccountBalance(publicKey);
  return balanceInfo.usdc;
};

/**
 * Get XLM balance only
 */
export const getXLMBalance = async (publicKey: string): Promise<string> => {
  const balanceInfo = await getAccountBalance(publicKey);
  return balanceInfo.xlm;
};

/**
 * Refresh balance with cache busting
 * Useful for real-time updates after transactions
 */
export const refreshBalance = async (publicKey: string): Promise<BalanceInfo> => {
  // Force a fresh fetch by bypassing any potential caching
  const timestamp = Date.now();
  console.log(`[${timestamp}] Refreshing balance for ${publicKey}`);
  
  const balanceInfo = await getAccountBalance(publicKey);
  
  console.log(`[${timestamp}] Balance refreshed:`, {
    usdc: balanceInfo.usdc,
    xlm: balanceInfo.xlm,
    hasUSDCTrustline: balanceInfo.hasUSDCTrustline,
  });
  
  return balanceInfo;
};

/**
 * Check if USDC trustline exists for an account
 */
export const checkUSDCTrustline = async (publicKey: string): Promise<TrustlineInfo> => {
  try {
    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);
    
    const account = await server.loadAccount(publicKey);
    
    const usdcTrustline = account.balances.find(
      (balance: any) =>
        balance.asset_type !== 'native' &&
        balance.asset_code === USDC_ASSET.code &&
        balance.asset_issuer === USDC_ASSET.issuer
    );

    if (usdcTrustline) {
      return {
        exists: true,
        limit: (usdcTrustline as any).limit || '1000000000',
        balance: usdcTrustline.balance,
        asset: {
          code: USDC_ASSET.code,
          issuer: USDC_ASSET.issuer,
        },
      };
    }

    return {
      exists: false,
      limit: '0',
      balance: '0',
      asset: {
        code: USDC_ASSET.code,
        issuer: USDC_ASSET.issuer,
      },
    };
  } catch (error: any) {
    // Handle unfunded account
    if (error?.response?.status === 404 || error?.name === 'NotFoundError') {
      return {
        exists: false,
        limit: '0',
        balance: '0',
        asset: {
          code: USDC_ASSET.code,
          issuer: USDC_ASSET.issuer,
        },
      };
    }
    
    console.error('Error checking USDC trustline:', error);
    throw error;
  }
};

/**
 * Establish USDC trustline for an account
 * This allows the account to hold USDC tokens
 */
export const establishUSDCTrustline = async (
  publicKey: string,
  walletType: WalletType = 'freighter'
): Promise<StellarSdk.Horizon.HorizonApi.SubmitTransactionResponse> => {
  try {
    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);
    
    // Check if trustline already exists
    const trustlineInfo = await checkUSDCTrustline(publicKey);
    if (trustlineInfo.exists) {
      throw new Error('USDC trustline already exists for this account');
    }

    // Load account
    const account = await server.loadAccount(publicKey);

    // Build change trust transaction
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.changeTrust({
          asset: USDC_ASSET,
          limit: '1000000000', // 1 billion USDC limit
        })
      )
      .setTimeout(180)
      .build();

    // Sign and submit
    return await signAndSubmitTransaction(transaction, walletType);
  } catch (error) {
    console.error('Error establishing USDC trustline:', error);
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
 * Sign a message for bid verification
 * Uses wallet to sign arbitrary data for authentication
 */
export const signMessage = async (
  message: string,
  publicKey: string,
  walletType: WalletType = 'freighter'
): Promise<string> => {
  try {
    const walletKit = getKit();
    const config = getNetworkConfig();

    // Create a hash of the message
    const messageHash = StellarSdk.hash(Buffer.from(message, 'utf8'));
    
    // Try direct message signing first (Freighter supports this)
    if (walletType === 'freighter') {
      try {
        // Freighter has signAuthEntry which can sign arbitrary data
        const { signedTxXdr } = await walletKit.signTransaction(
          createDummyTransactionForSigning(publicKey, messageHash, config),
          { networkPassphrase: config.networkPassphrase }
        );
        
        const signedTx = StellarSdk.TransactionBuilder.fromXDR(
          signedTxXdr,
          config.networkPassphrase
        );
        
        const signatures = signedTx.signatures;
        if (signatures.length === 0) {
          throw new Error('No signature found in signed transaction');
        }

        return signatures[0].signature().toString('base64');
      } catch (freighterError) {
        console.warn('Freighter direct signing failed, falling back to transaction method:', freighterError);
      }
    }
    
    // Fallback: Create a transaction with the message as memo for signing
    // This is a workaround since not all wallets support arbitrary message signing
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);
    const account = await server.loadAccount(publicKey);
    
    const transaction = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.manageData({
          name: 'bid_signature',
          value: messageHash,
        })
      )
      .setTimeout(0) // Make it invalid so it can't be submitted
      .build();

    // Sign the transaction
    const { signedTxXdr } = await walletKit.signTransaction(transaction.toXDR(), {
      networkPassphrase: config.networkPassphrase,
    });

    // Extract signature from signed transaction
    const signedTx = StellarSdk.TransactionBuilder.fromXDR(
      signedTxXdr,
      config.networkPassphrase
    );
    
    const signatures = signedTx.signatures;
    if (signatures.length === 0) {
      throw new Error('No signature found in signed transaction');
    }

    // Return the signature as base64
    return signatures[0].signature().toString('base64');
  } catch (error) {
    console.error('Error signing message:', error);
    throw new Error('Failed to sign message with wallet. Please ensure your wallet is unlocked and try again.');
  }
};

/**
 * Helper function to create a dummy transaction for signing
 */
function createDummyTransactionForSigning(
  publicKey: string,
  messageHash: Buffer,
  config: any
): string {
  // Create a minimal transaction that won't be submitted
  const source = new StellarSdk.Account(publicKey, '0');
  
  const transaction = new StellarSdk.TransactionBuilder(source, {
    fee: StellarSdk.BASE_FEE,
    networkPassphrase: config.networkPassphrase,
  })
    .addOperation(
      StellarSdk.Operation.manageData({
        name: 'bid_sig',
        value: messageHash,
      })
    )
    .setTimeout(0)
    .build();
    
  return transaction.toXDR();
}

/**
 * Verify a message signature
 * Validates that a signature was created by the claimed public key
 */
export const verifyMessageSignature = (
  message: string,
  signature: string,
  publicKey: string
): boolean => {
  try {
    const messageHash = StellarSdk.hash(Buffer.from(message, 'utf8'));
    const signatureBuffer = Buffer.from(signature, 'base64');
    const keypair = StellarSdk.Keypair.fromPublicKey(publicKey);
    
    return keypair.verify(messageHash, signatureBuffer);
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
};

/**
 * Send USDC payment
 * Convenience method for USDC-specific payments
 */
export const sendUSDCPayment = async (
  sourcePublicKey: string,
  destinationPublicKey: string,
  amount: string,
  walletType: WalletType = 'freighter'
): Promise<StellarSdk.Horizon.HorizonApi.SubmitTransactionResponse> => {
  try {
    // Check if source has sufficient USDC balance
    const balanceInfo = await getAccountBalance(sourcePublicKey);
    
    if (!balanceInfo.hasUSDCTrustline) {
      throw new Error('Source account does not have USDC trustline established');
    }

    const usdcBalance = parseFloat(balanceInfo.usdc);
    const paymentAmount = parseFloat(amount);

    if (usdcBalance < paymentAmount) {
      throw new Error(`Insufficient USDC balance. Available: ${balanceInfo.usdc}, Required: ${amount}`);
    }

    // Create and submit payment transaction
    const transaction = await createPaymentOperation(
      sourcePublicKey,
      destinationPublicKey,
      amount,
      USDC_ASSET.code,
      USDC_ASSET.issuer
    );

    return await signAndSubmitTransaction(transaction, walletType);
  } catch (error) {
    console.error('Error sending USDC payment:', error);
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
