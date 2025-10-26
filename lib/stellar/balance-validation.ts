/**
 * USDC Balance Validation Utility
 * Provides reusable balance checking and validation for all payment flows
 */

import { getUSDCBalance, getAccountBalance } from './wallet';
import { USDC_ASSET } from './config';

export interface BalanceValidationResult {
  isValid: boolean;
  available: string;
  required: string;
  shortfall?: string;
  message?: string;
  needsDeposit: boolean;
}

export interface BalanceCheckOptions {
  includeReserve?: boolean; // Reserve some USDC for fees
  reserveAmount?: string; // Amount to reserve (default: 1 USDC)
}

const DEFAULT_RESERVE = '1.0'; // Reserve 1 USDC for potential fees

/**
 * Validate if account has sufficient USDC balance for a transaction
 * Returns detailed validation result with user-friendly messages
 */
export async function validateUSDCBalance(
  publicKey: string,
  requiredAmount: string,
  options: BalanceCheckOptions = {}
): Promise<BalanceValidationResult> {
  try {
    const { includeReserve = true, reserveAmount = DEFAULT_RESERVE } = options;

    // Get current USDC balance
    const balanceInfo = await getAccountBalance(publicKey);
    const availableBalance = parseFloat(balanceInfo.usdc);
    const required = parseFloat(requiredAmount);

    // Check if USDC trustline exists
    if (!balanceInfo.hasUSDCTrustline) {
      return {
        isValid: false,
        available: '0',
        required: requiredAmount,
        shortfall: requiredAmount,
        message: 'USDC trustline not established. Please set up USDC in your wallet first.',
        needsDeposit: true,
      };
    }

    // Calculate effective available balance (with reserve if needed)
    const reserve = includeReserve ? parseFloat(reserveAmount) : 0;
    const effectiveAvailable = Math.max(0, availableBalance - reserve);

    // Validate amount
    if (isNaN(required) || required <= 0) {
      return {
        isValid: false,
        available: balanceInfo.usdc,
        required: requiredAmount,
        message: 'Invalid amount specified',
        needsDeposit: false,
      };
    }

    // Check if sufficient balance
    if (effectiveAvailable >= required) {
      return {
        isValid: true,
        available: balanceInfo.usdc,
        required: requiredAmount,
        message: 'Sufficient balance available',
        needsDeposit: false,
      };
    }

    // Insufficient balance
    const shortfall = (required - effectiveAvailable).toFixed(2);
    return {
      isValid: false,
      available: balanceInfo.usdc,
      required: requiredAmount,
      shortfall,
      message: `Insufficient USDC balance. You need ${shortfall} more USDC.`,
      needsDeposit: true,
    };
  } catch (error) {
    console.error('Balance validation error:', error);
    return {
      isValid: false,
      available: '0',
      required: requiredAmount,
      message: 'Unable to check balance. Please try again.',
      needsDeposit: false,
    };
  }
}

/**
 * Quick check if account has sufficient USDC (returns boolean only)
 */
export async function hasUSDCBalance(
  publicKey: string,
  requiredAmount: string,
  options: BalanceCheckOptions = {}
): Promise<boolean> {
  const result = await validateUSDCBalance(publicKey, requiredAmount, options);
  return result.isValid;
}

/**
 * Get formatted balance validation message for UI display
 */
export function getBalanceValidationMessage(result: BalanceValidationResult): {
  title: string;
  message: string;
  action?: string;
  actionLink?: string;
} {
  if (result.isValid) {
    return {
      title: 'Balance Confirmed',
      message: `You have ${result.available} USDC available`,
    };
  }

  if (!result.message) {
    return {
      title: 'Balance Check Failed',
      message: 'Unable to verify your balance',
    };
  }

  // Insufficient balance
  if (result.needsDeposit) {
    return {
      title: 'Insufficient USDC Balance',
      message: result.message,
      action: 'Deposit USDC',
      actionLink: '/dashboard?tab=deposit',
    };
  }

  // Other validation errors
  return {
    title: 'Balance Validation Error',
    message: result.message,
  };
}

/**
 * Format USDC amount for display
 */
export function formatUSDC(amount: string | number, options?: {
  showSymbol?: boolean;
  decimals?: number;
}): string {
  const { showSymbol = true, decimals = 2 } = options || {};
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(num)) {
    return showSymbol ? '$0.00 USDC' : '0.00';
  }

  const formatted = num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return showSymbol ? `$${formatted} USDC` : formatted;
}

/**
 * Pre-transaction validation hook
 * Validates balance before initiating any payment transaction
 */
export async function preTransactionValidation(
  publicKey: string,
  amount: string,
  transactionType: 'funding' | 'bid' | 'escrow' | 'payment'
): Promise<{
  canProceed: boolean;
  validationResult: BalanceValidationResult;
  warnings?: string[];
}> {
  const warnings: string[] = [];

  // Validate balance with reserve
  const validationResult = await validateUSDCBalance(publicKey, amount, {
    includeReserve: true,
    reserveAmount: '1.0',
  });

  // Add transaction-specific warnings
  if (validationResult.isValid) {
    const available = parseFloat(validationResult.available);
    const required = parseFloat(validationResult.required);
    const remaining = available - required;

    // Warn if balance will be low after transaction
    if (remaining < 10) {
      warnings.push(`Your balance will be low (${formatUSDC(remaining)}) after this transaction`);
    }

    // Transaction-specific warnings
    switch (transactionType) {
      case 'funding':
        warnings.push('Funds will be locked in escrow until milestones are completed');
        break;
      case 'bid':
        warnings.push('Ensure you have sufficient balance to complete the project if your bid is accepted');
        break;
      case 'escrow':
        warnings.push('Escrow funds cannot be withdrawn until release conditions are met');
        break;
    }
  }

  return {
    canProceed: validationResult.isValid,
    validationResult,
    warnings: warnings.length > 0 ? warnings : undefined,
  };
}

/**
 * Calculate transaction fee estimate (for display purposes)
 */
export function estimateTransactionFee(operationCount: number = 1): string {
  // Stellar base fee is 100 stroops (0.00001 XLM) per operation
  // For USDC transactions, we typically need 1-2 operations
  const baseFeeStroops = 100;
  const totalStroops = baseFeeStroops * operationCount;
  const xlmFee = totalStroops / 10000000; // Convert stroops to XLM
  
  return xlmFee.toFixed(7);
}

/**
 * Validate multiple amounts (e.g., for milestone validation)
 */
export async function validateMultipleAmounts(
  publicKey: string,
  amounts: string[]
): Promise<{
  isValid: boolean;
  totalRequired: string;
  validationResult: BalanceValidationResult;
}> {
  const total = amounts.reduce((sum, amount) => {
    const num = parseFloat(amount);
    return sum + (isNaN(num) ? 0 : num);
  }, 0);

  const totalRequired = total.toFixed(2);
  const validationResult = await validateUSDCBalance(publicKey, totalRequired);

  return {
    isValid: validationResult.isValid,
    totalRequired,
    validationResult,
  };
}
