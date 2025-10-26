/**
 * USDC Payment System
 * Handles USDC trustline creation, balance checks, and transfers
 * Integrates with Trustless Work escrows for project payments
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { getNetworkConfig, USDC_ASSET } from './config';
import { signAndSubmitTransaction, WalletType, getAccountBalance } from './wallet';
import { validateTransaction, executeWithRetry } from './validation';
import { toast } from 'sonner';

export interface PaymentResult {
  success: boolean;
  transactionHash?: string;
  error?: string;
}

export interface TrustlineStatus {
  exists: boolean;
  balance: string;
  limit: string;
  asset: {
    code: string;
    issuer: string;
  };
}

/**
 * Check if USDC trustline exists for an account
 */
export const checkUSDCTrustline = async (publicKey: string): Promise<TrustlineStatus | null> => {
  try {
    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);
    
    const account = await server.loadAccount(publicKey);
    
    // Find USDC trustline
    const usdcTrustline = account.balances.find(
      (balance: any) =>
        balance.asset_type !== 'native' &&
        balance.asset_code === USDC_ASSET.code &&
        balance.asset_issuer === USDC_ASSET.issuer
    );

    if (!usdcTrustline) {
      return null;
    }

    return {
      exists: true,
      balance: usdcTrustline.balance,
      limit: (usdcTrustline as any).limit || '1000000000',
      asset: {
        code: USDC_ASSET.code,
        issuer: USDC_ASSET.issuer,
      },
    };
  } catch (error) {
    console.error('Error checking USDC trustline:', error);
    throw error;
  }
};

/**
 * Create USDC trustline for an account
 * This is required before an account can receive USDC
 */
export const createUSDCTrustline = async (
  publicKey: string,
  walletType: WalletType = 'freighter'
): Promise<PaymentResult> => {
  try {
    toast.info('Creating USDC trustline...');

    // Check if trustline already exists
    const existing = await checkUSDCTrustline(publicKey);
    if (existing) {
      toast.success('USDC trustline already exists!');
      return {
        success: true,
        error: 'Trustline already exists',
      };
    }

    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);
    
    // Load account
    const account = await server.loadAccount(publicKey);
    
    // Build trustline transaction
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
    const result = await signAndSubmitTransaction(transaction, walletType);
    
    toast.success('USDC trustline created successfully!');
    
    return {
      success: true,
      transactionHash: result.hash,
    };
  } catch (error: any) {
    console.error('Error creating USDC trustline:', error);
    toast.error(`Failed to create trustline: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Get USDC balance for an account
 */
export const getUSDCBalance = async (publicKey: string): Promise<string> => {
  try {
    const trustline = await checkUSDCTrustline(publicKey);
    return trustline?.balance || '0.0000000';
  } catch (error) {
    console.error('Error getting USDC balance:', error);
    return '0.0000000';
  }
};

/**
 * Transfer USDC from one account to another
 */
export const transferUSDC = async (
  fromPublicKey: string,
  toPublicKey: string,
  amount: string,
  memo?: string,
  walletType: WalletType = 'freighter'
): Promise<PaymentResult> => {
  try {
    toast.info(`Sending ${amount} USDC...`);

    // Check sender has USDC trustline
    const senderTrustline = await checkUSDCTrustline(fromPublicKey);
    if (!senderTrustline) {
      throw new Error('You need to create a USDC trustline first');
    }

    // Check receiver has USDC trustline
    const receiverTrustline = await checkUSDCTrustline(toPublicKey);
    if (!receiverTrustline) {
      throw new Error('Recipient has not set up USDC trustline');
    }

    // Check sufficient balance
    const balance = parseFloat(senderTrustline.balance);
    const amountNum = parseFloat(amount);
    if (balance < amountNum) {
      throw new Error(`Insufficient USDC balance. You have ${balance} USDC`);
    }

    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);
    
    // Load account
    const account = await server.loadAccount(fromPublicKey);
    
    // Build payment transaction
    const txBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: toPublicKey,
          asset: USDC_ASSET,
          amount: amount,
        })
      );

    // Add memo if provided
    if (memo) {
      txBuilder.addMemo(StellarSdk.Memo.text(memo));
    }

    const transaction = txBuilder.setTimeout(180).build();

    // Sign and submit with retry
    const result = await executeWithRetry(
      () => signAndSubmitTransaction(transaction, walletType)
    );
    
    if (!result.success || !result.data) {
      throw new Error(result.error || 'Transaction failed');
    }
    
    toast.success(`Successfully sent ${amount} USDC!`);
    
    return {
      success: true,
      transactionHash: result.data.hash,
    };
  } catch (error: any) {
    console.error('Error transferring USDC:', error);
    toast.error(`Transfer failed: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Transfer XLM (native Stellar token)
 */
export const transferXLM = async (
  fromPublicKey: string,
  toPublicKey: string,
  amount: string,
  memo?: string,
  walletType: WalletType = 'freighter'
): Promise<PaymentResult> => {
  try {
    toast.info(`Sending ${amount} XLM...`);

    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);
    
    // Load account
    const account = await server.loadAccount(fromPublicKey);
    
    // Build payment transaction
    const txBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: StellarSdk.BASE_FEE,
      networkPassphrase: config.networkPassphrase,
    })
      .addOperation(
        StellarSdk.Operation.payment({
          destination: toPublicKey,
          asset: StellarSdk.Asset.native(),
          amount: amount,
        })
      );

    // Add memo if provided
    if (memo) {
      txBuilder.addMemo(StellarSdk.Memo.text(memo));
    }

    const transaction = txBuilder.setTimeout(180).build();

    // Sign and submit
    const result = await signAndSubmitTransaction(transaction, walletType);
    
    toast.success(`Successfully sent ${amount} XLM!`);
    
    return {
      success: true,
      transactionHash: result.hash,
    };
  } catch (error: any) {
    console.error('Error transferring XLM:', error);
    toast.error(`Transfer failed: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Create payment transaction for batch processing
 * Useful for milestone releases or multiple payments
 */
export const createBatchPayment = async (
  fromPublicKey: string,
  payments: Array<{ destination: string; amount: string; asset?: 'USDC' | 'XLM' }>,
  walletType: WalletType = 'freighter'
): Promise<PaymentResult> => {
  try {
    toast.info(`Processing ${payments.length} payments...`);

    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);
    
    // Load account
    const account = await server.loadAccount(fromPublicKey);
    
    // Build batch payment transaction
    const txBuilder = new StellarSdk.TransactionBuilder(account, {
      fee: (parseInt(StellarSdk.BASE_FEE) * payments.length).toString(),
      networkPassphrase: config.networkPassphrase,
    });

    // Add all payment operations
    for (const payment of payments) {
      const asset = payment.asset === 'USDC' ? USDC_ASSET : StellarSdk.Asset.native();
      
      txBuilder.addOperation(
        StellarSdk.Operation.payment({
          destination: payment.destination,
          asset: asset,
          amount: payment.amount,
        })
      );
    }

    const transaction = txBuilder.setTimeout(180).build();

    // Sign and submit
    const result = await signAndSubmitTransaction(transaction, walletType);
    
    toast.success(`Successfully processed ${payments.length} payments!`);
    
    return {
      success: true,
      transactionHash: result.hash,
    };
  } catch (error: any) {
    console.error('Error processing batch payment:', error);
    toast.error(`Batch payment failed: ${error.message}`);
    
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Setup account for USDC payments (create trustline + fund with XLM)
 * One-time setup function for new users
 */
export const setupUSDCAccount = async (
  publicKey: string,
  walletType: WalletType = 'freighter'
): Promise<{ trustlineCreated: boolean; message: string }> => {
  try {
    // Check if account has minimum XLM balance (need ~2 XLM for base reserve + trustline)
    const balances = await getAccountBalance(publicKey);
    const xlmBalance = parseFloat(balances.xlm);
    
    if (xlmBalance < 2) {
      return {
        trustlineCreated: false,
        message: `Insufficient XLM balance. You need at least 2 XLM (you have ${xlmBalance} XLM). Get test XLM from https://laboratory.stellar.org`,
      };
    }

    // Create USDC trustline
    const result = await createUSDCTrustline(publicKey, walletType);
    
    if (!result.success) {
      return {
        trustlineCreated: false,
        message: result.error || 'Failed to create trustline',
      };
    }

    return {
      trustlineCreated: true,
      message: 'USDC account setup complete! You can now receive and send USDC.',
    };
  } catch (error: any) {
    return {
      trustlineCreated: false,
      message: error.message,
    };
  }
};
