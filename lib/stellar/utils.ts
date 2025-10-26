/**
 * Utility functions for Stellar integration
 */

import { StellarError, ErrorCode } from './types';

/**
 * Handle Stellar errors and convert to user-friendly messages
 */
export interface UserFriendlyMessage {
  title: string;
  message: string;
  action?: string;
}

export function handleStellarError(error: StellarError | Error): UserFriendlyMessage {
  if (error instanceof StellarError) {
    switch (error.code) {
      case ErrorCode.USER_REJECTED:
        return {
          title: 'Transaction Cancelled',
          message: 'You rejected the transaction in your wallet.',
        };
      
      case ErrorCode.INSUFFICIENT_FUNDS:
        return {
          title: 'Insufficient Funds',
          message: 'Your wallet balance is too low to complete this transaction.',
          action: 'Add funds to your wallet',
        };
      
      case ErrorCode.WALLET_ERROR:
        return {
          title: 'Wallet Error',
          message: 'There was a problem connecting to your wallet. Please try again.',
          action: 'Reconnect wallet',
        };
      
      case ErrorCode.NETWORK_ERROR:
        return {
          title: 'Network Error',
          message: 'Unable to connect to the Stellar network. Please check your connection.',
          action: 'Retry',
        };
      
      case ErrorCode.CONTRACT_ERROR:
        return {
          title: 'Contract Error',
          message: 'There was an error interacting with the smart contract.',
        };
      
      case ErrorCode.UNAUTHORIZED:
        return {
          title: 'Unauthorized',
          message: 'You do not have permission to perform this action.',
        };
      
      case ErrorCode.INVALID_PARAMS:
        return {
          title: 'Invalid Parameters',
          message: 'The transaction parameters are invalid. Please check your input.',
        };
      
      case ErrorCode.TRANSACTION_FAILED:
        return {
          title: 'Transaction Failed',
          message: 'The transaction could not be completed. Please try again.',
        };
      
      default:
        return {
          title: 'Error',
          message: error.message || 'An unexpected error occurred.',
        };
    }
  }

  return {
    title: 'Error',
    message: error.message || 'An unexpected error occurred.',
  };
}

/**
 * Retry a function with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

/**
 * Format Stellar address for display (truncate middle)
 */
export function formatAddress(address: string, startChars: number = 6, endChars: number = 4): string {
  if (!address || address.length <= startChars + endChars) {
    return address;
  }
  
  return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Validate Stellar public key format
 */
export function isValidPublicKey(publicKey: string): boolean {
  return /^G[A-Z0-9]{55}$/.test(publicKey);
}

/**
 * Convert stroops to XLM
 */
export function stroopsToXlm(stroops: string | number): string {
  const amount = typeof stroops === 'string' ? parseFloat(stroops) : stroops;
  return (amount / 10000000).toFixed(7);
}

/**
 * Convert XLM to stroops
 */
export function xlmToStroops(xlm: string | number): string {
  const amount = typeof xlm === 'string' ? parseFloat(xlm) : xlm;
  return Math.floor(amount * 10000000).toString();
}

/**
 * Format amount for display
 */
export function formatAmount(amount: string | number, decimals: number = 7): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) {
    return '0';
  }
  
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: decimals,
  });
}

/**
 * Parse amount from user input
 */
export function parseAmount(input: string): number {
  const cleaned = input.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Get Stellar Expert URL for transaction
 */
export function getStellarExpertUrl(hash: string, network: 'testnet' | 'mainnet' = 'testnet'): string {
  const domain = network === 'testnet' ? 'testnet' : 'public';
  return `https://stellar.expert/explorer/${domain}/tx/${hash}`;
}

/**
 * Get Stellar Expert URL for account
 */
export function getStellarExpertAccountUrl(publicKey: string, network: 'testnet' | 'mainnet' = 'testnet'): string {
  const domain = network === 'testnet' ? 'testnet' : 'public';
  return `https://stellar.expert/explorer/${domain}/account/${publicKey}`;
}

/**
 * Sleep for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
