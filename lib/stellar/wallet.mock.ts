/**
 * Temporary Mock for Stellar Wallet
 * This file provides type-safe mocks until @stellar/stellar-sdk is installed
 * Replace with real implementation after running: npm install
 */

export type WalletType = 'freighter' | 'albedo' | 'rabet';

export interface WalletState {
  connected: boolean;
  publicKey: string | null;
  walletType: WalletType | null;
  balance: string | null;
  usdcBalance: string | null;
}

/**
 * MOCK: Connect to Freighter wallet
 */
export const connectFreighter = async (): Promise<string> => {
  console.warn('⚠️ MOCK MODE: Install dependencies with "npm install" for real wallet integration');
  throw new Error('Please install dependencies: npm install @stellar/freighter-api @stellar/stellar-sdk');
};

/**
 * MOCK: Connect to Albedo wallet
 */
export const connectAlbedo = async (): Promise<string> => {
  console.warn('⚠️ MOCK MODE: Install dependencies with "npm install" for real wallet integration');
  throw new Error('Please install dependencies: npm install @stellar/freighter-api @stellar/stellar-sdk');
};

/**
 * MOCK: Generic wallet connection handler
 */
export const connectWallet = async (walletType: WalletType = 'freighter'): Promise<string> => {
  console.warn('⚠️ MOCK MODE: Install dependencies with "npm install" for real wallet integration');
  throw new Error('Please install dependencies: npm install');
};

/**
 * MOCK: Get account balance from Stellar network
 */
export const getAccountBalance = async (publicKey: string): Promise<{ xlm: string; usdc: string }> => {
  console.warn('⚠️ MOCK MODE: Install dependencies with "npm install" for real wallet integration');
  return { xlm: '0', usdc: '0' };
};

/**
 * MOCK: Sign and submit transaction
 */
export const signAndSubmitTransaction = async (transaction: any, walletType: WalletType = 'freighter'): Promise<any> => {
  console.warn('⚠️ MOCK MODE: Install dependencies with "npm install" for real wallet integration');
  throw new Error('Please install dependencies: npm install');
};

/**
 * MOCK: Create payment operation
 */
export const createPaymentOperation = async (
  sourcePublicKey: string,
  destinationPublicKey: string,
  amount: string,
  assetCode: string = 'XLM',
  assetIssuer?: string
): Promise<any> => {
  console.warn('⚠️ MOCK MODE: Install dependencies with "npm install" for real wallet integration');
  throw new Error('Please install dependencies: npm install');
};

/**
 * MOCK: Check if wallet is connected
 */
export const checkWalletConnection = async (): Promise<boolean> => {
  return false;
};

/**
 * MOCK: Disconnect wallet
 */
export const disconnectWallet = (): void => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('stellar_wallet_type');
    localStorage.removeItem('stellar_public_key');
  }
};
