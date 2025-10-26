/**
 * Error handling utilities for Stellar integration
 * Provides comprehensive error classification, user-friendly messages, and logging
 */

import { ErrorCode, StellarError } from './types';

/**
 * User-friendly error message structure
 */
export interface UserFriendlyMessage {
  title: string;
  message: string;
  action?: string;
  severity: 'error' | 'warning' | 'info';
}

/**
 * Error log entry structure
 */
export interface ErrorLogEntry {
  timestamp: string;
  code: ErrorCode;
  message: string;
  details?: any;
  stack?: string;
  userId?: string;
  context?: Record<string, any>;
}

/**
 * Error logger interface
 */
export interface ErrorLogger {
  log(entry: ErrorLogEntry): void;
  getRecentErrors(limit?: number): ErrorLogEntry[];
  clearLogs(): void;
}

/**
 * In-memory error logger implementation
 */
class InMemoryErrorLogger implements ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs: number = 100;

  log(entry: ErrorLogEntry): void {
    this.logs.push(entry);
    
    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[Stellar Error]', entry);
    }
  }

  getRecentErrors(limit: number = 10): ErrorLogEntry[] {
    return this.logs.slice(-limit);
  }

  clearLogs(): void {
    this.logs = [];
  }
}

/**
 * Console error logger for production
 */
class ConsoleErrorLogger implements ErrorLogger {
  log(entry: ErrorLogEntry): void {
    console.error('[Stellar Error]', {
      timestamp: entry.timestamp,
      code: entry.code,
      message: entry.message,
    });
  }

  getRecentErrors(): ErrorLogEntry[] {
    return [];
  }

  clearLogs(): void {
    // No-op for console logger
  }
}

// Singleton logger instance
let errorLogger: ErrorLogger = new InMemoryErrorLogger();

/**
 * Set custom error logger
 */
export function setErrorLogger(logger: ErrorLogger): void {
  errorLogger = logger;
}

/**
 * Get current error logger
 */
export function getErrorLogger(): ErrorLogger {
  return errorLogger;
}

/**
 * Convert StellarError to user-friendly message
 */
export function handleStellarError(error: StellarError | Error): UserFriendlyMessage {
  // Log the error
  logError(error);

  // If not a StellarError, treat as unknown error
  if (!(error instanceof StellarError)) {
    return {
      title: 'Unexpected Error',
      message: 'An unexpected error occurred. Please try again.',
      severity: 'error',
    };
  }

  // Map error codes to user-friendly messages
  switch (error.code) {
    case ErrorCode.USER_REJECTED:
      return {
        title: 'Transaction Cancelled',
        message: 'You cancelled the transaction in your wallet.',
        severity: 'info',
      };

    case ErrorCode.INSUFFICIENT_FUNDS:
      return {
        title: 'Insufficient Funds',
        message: 'Your wallet does not have enough funds to complete this transaction.',
        action: 'Please add funds to your wallet and try again.',
        severity: 'error',
      };

    case ErrorCode.WALLET_ERROR:
      return {
        title: 'Wallet Connection Error',
        message: 'There was a problem connecting to your wallet.',
        action: 'Please check that your wallet is unlocked and try again.',
        severity: 'error',
      };

    case ErrorCode.NETWORK_ERROR:
      return {
        title: 'Network Error',
        message: 'Unable to connect to the Stellar network.',
        action: 'Please check your internet connection and try again.',
        severity: 'error',
      };

    case ErrorCode.CONTRACT_ERROR:
      return {
        title: 'Smart Contract Error',
        message: error.message || 'The smart contract operation failed.',
        action: 'Please verify your transaction details and try again.',
        severity: 'error',
      };

    case ErrorCode.ANCHOR_ERROR:
      return {
        title: 'Payment Processing Error',
        message: 'There was a problem processing your payment.',
        action: 'Please contact support if the problem persists.',
        severity: 'error',
      };

    case ErrorCode.UNAUTHORIZED:
      return {
        title: 'Unauthorized',
        message: 'You do not have permission to perform this action.',
        severity: 'error',
      };

    case ErrorCode.INVALID_PARAMS:
      return {
        title: 'Invalid Parameters',
        message: error.message || 'The provided parameters are invalid.',
        action: 'Please check your input and try again.',
        severity: 'error',
      };

    case ErrorCode.TRANSACTION_FAILED:
      return {
        title: 'Transaction Failed',
        message: 'The transaction could not be completed.',
        action: 'Please try again or contact support if the problem persists.',
        severity: 'error',
      };

    default:
      return {
        title: 'Error',
        message: error.message || 'An error occurred.',
        severity: 'error',
      };
  }
}

/**
 * Log error to the error logger
 */
export function logError(
  error: Error | StellarError,
  context?: Record<string, any>
): void {
  const entry: ErrorLogEntry = {
    timestamp: new Date().toISOString(),
    code: error instanceof StellarError ? error.code : ErrorCode.NETWORK_ERROR,
    message: error.message,
    details: error instanceof StellarError ? error.details : undefined,
    stack: error.stack,
    context,
  };

  errorLogger.log(entry);
}

/**
 * Create a StellarError from an unknown error
 */
export function createStellarError(
  error: unknown,
  defaultCode: ErrorCode = ErrorCode.NETWORK_ERROR,
  defaultMessage: string = 'An error occurred'
): StellarError {
  if (error instanceof StellarError) {
    return error;
  }

  if (error instanceof Error) {
    return new StellarError(error.message, defaultCode, error);
  }

  return new StellarError(defaultMessage, defaultCode, error);
}

/**
 * Check if error is a specific type
 */
export function isErrorCode(error: unknown, code: ErrorCode): boolean {
  return error instanceof StellarError && error.code === code;
}

/**
 * Check if error is user-rejected transaction
 */
export function isUserRejectedError(error: unknown): boolean {
  return isErrorCode(error, ErrorCode.USER_REJECTED);
}

/**
 * Check if error is insufficient funds
 */
export function isInsufficientFundsError(error: unknown): boolean {
  return isErrorCode(error, ErrorCode.INSUFFICIENT_FUNDS);
}

/**
 * Check if error is network-related
 */
export function isNetworkError(error: unknown): boolean {
  return isErrorCode(error, ErrorCode.NETWORK_ERROR);
}

/**
 * Parse Stellar SDK errors into StellarError
 */
export function parseStellarSDKError(error: any): StellarError {
  // Check for specific Stellar SDK error patterns
  if (error?.response?.status === 400) {
    const resultCodes = error?.response?.data?.extras?.result_codes;
    
    if (resultCodes?.transaction === 'tx_insufficient_balance') {
      return new StellarError(
        'Insufficient balance to complete transaction',
        ErrorCode.INSUFFICIENT_FUNDS,
        error
      );
    }

    if (resultCodes?.transaction === 'tx_bad_auth') {
      return new StellarError(
        'Transaction authorization failed',
        ErrorCode.UNAUTHORIZED,
        error
      );
    }

    return new StellarError(
      'Invalid transaction',
      ErrorCode.TRANSACTION_FAILED,
      error
    );
  }

  if (error?.response?.status === 404) {
    return new StellarError(
      'Resource not found',
      ErrorCode.NETWORK_ERROR,
      error
    );
  }

  if (error?.response?.status >= 500) {
    return new StellarError(
      'Stellar network error',
      ErrorCode.NETWORK_ERROR,
      error
    );
  }

  // Check for timeout errors
  if (error?.code === 'ECONNABORTED' || error?.message?.includes('timeout')) {
    return new StellarError(
      'Request timeout',
      ErrorCode.NETWORK_ERROR,
      error
    );
  }

  // Check for wallet errors
  if (error?.message?.includes('User declined') || 
      error?.message?.includes('rejected')) {
    return new StellarError(
      'Transaction rejected by user',
      ErrorCode.USER_REJECTED,
      error
    );
  }

  // Default to network error
  return new StellarError(
    error?.message || 'Unknown error',
    ErrorCode.NETWORK_ERROR,
    error
  );
}

/**
 * Get error severity level
 */
export function getErrorSeverity(error: StellarError): 'critical' | 'error' | 'warning' | 'info' {
  switch (error.code) {
    case ErrorCode.USER_REJECTED:
      return 'info';
    
    case ErrorCode.INVALID_PARAMS:
      return 'warning';
    
    case ErrorCode.INSUFFICIENT_FUNDS:
    case ErrorCode.UNAUTHORIZED:
      return 'error';
    
    case ErrorCode.NETWORK_ERROR:
    case ErrorCode.CONTRACT_ERROR:
    case ErrorCode.TRANSACTION_FAILED:
      return 'critical';
    
    default:
      return 'error';
  }
}

/**
 * Format error for display
 */
export function formatErrorMessage(error: StellarError): string {
  const userMessage = handleStellarError(error);
  let message = `${userMessage.title}: ${userMessage.message}`;
  
  if (userMessage.action) {
    message += ` ${userMessage.action}`;
  }
  
  return message;
}

/**
 * Export error statistics
 */
export function getErrorStatistics(): {
  total: number;
  byCode: Record<ErrorCode, number>;
  recent: ErrorLogEntry[];
} {
  const recentErrors = errorLogger.getRecentErrors(100);
  const byCode: Record<ErrorCode, number> = {} as Record<ErrorCode, number>;
  
  recentErrors.forEach(entry => {
    byCode[entry.code] = (byCode[entry.code] || 0) + 1;
  });
  
  return {
    total: recentErrors.length,
    byCode,
    recent: recentErrors.slice(-10),
  };
}
