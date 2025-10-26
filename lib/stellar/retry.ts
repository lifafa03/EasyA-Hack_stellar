/**
 * Retry logic utilities for failed transactions
 * Implements exponential backoff and transaction queue for offline scenarios
 */

import { StellarError, ErrorCode } from './types';
import { createStellarError, logError } from './errors';

/**
 * Retry configuration options
 */
export interface RetryOptions {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffMultiplier?: number;
  retryableErrors?: ErrorCode[];
  onRetry?: (attempt: number, error: Error) => void;
}

/**
 * Default retry configuration
 */
const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
  retryableErrors: [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.TRANSACTION_FAILED,
  ],
  onRetry: () => {},
};

/**
 * Retry an async operation with exponential backoff
 */
export async function withRetry<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  let lastError: Error;

  for (let attempt = 0; attempt < config.maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // Check if error is retryable
      if (error instanceof StellarError && !config.retryableErrors.includes(error.code)) {
        throw error;
      }

      // Don't retry on last attempt
      if (attempt === config.maxRetries - 1) {
        break;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );

      // Call retry callback
      config.onRetry(attempt + 1, lastError);

      // Log retry attempt
      logError(lastError, {
        retryAttempt: attempt + 1,
        maxRetries: config.maxRetries,
        nextRetryIn: delay,
      });

      // Wait before retry
      await sleep(delay);
    }
  }

  throw createStellarError(
    lastError!,
    ErrorCode.NETWORK_ERROR,
    `Operation failed after ${config.maxRetries} retries`
  );
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Transaction queue item
 */
export interface QueuedTransaction {
  id: string;
  operation: () => Promise<any>;
  retryOptions?: RetryOptions;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  createdAt: Date;
  lastAttemptAt?: Date;
  error?: Error;
  result?: any;
}

/**
 * Transaction queue for offline scenarios
 */
export class TransactionQueue {
  private queue: Map<string, QueuedTransaction> = new Map();
  private processing: boolean = false;
  private isOnline: boolean = true;

  constructor() {
    // Listen for online/offline events
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.handleOnline());
      window.addEventListener('offline', () => this.handleOffline());
      this.isOnline = navigator.onLine;
    }
  }

  /**
   * Add transaction to queue
   */
  enqueue(
    id: string,
    operation: () => Promise<any>,
    retryOptions?: RetryOptions
  ): void {
    const transaction: QueuedTransaction = {
      id,
      operation,
      retryOptions,
      status: 'pending',
      attempts: 0,
      createdAt: new Date(),
    };

    this.queue.set(id, transaction);

    // Try to process immediately if online
    if (this.isOnline) {
      this.processQueue();
    }
  }

  /**
   * Remove transaction from queue
   */
  dequeue(id: string): void {
    this.queue.delete(id);
  }

  /**
   * Get transaction status
   */
  getTransaction(id: string): QueuedTransaction | undefined {
    return this.queue.get(id);
  }

  /**
   * Get all transactions
   */
  getAllTransactions(): QueuedTransaction[] {
    return Array.from(this.queue.values());
  }

  /**
   * Get pending transactions
   */
  getPendingTransactions(): QueuedTransaction[] {
    return this.getAllTransactions().filter(tx => tx.status === 'pending');
  }

  /**
   * Get failed transactions
   */
  getFailedTransactions(): QueuedTransaction[] {
    return this.getAllTransactions().filter(tx => tx.status === 'failed');
  }

  /**
   * Clear completed transactions
   */
  clearCompleted(): void {
    for (const [id, tx] of this.queue.entries()) {
      if (tx.status === 'completed') {
        this.queue.delete(id);
      }
    }
  }

  /**
   * Clear all transactions
   */
  clearAll(): void {
    this.queue.clear();
  }

  /**
   * Retry a failed transaction
   */
  async retry(id: string): Promise<void> {
    const transaction = this.queue.get(id);
    if (!transaction || transaction.status !== 'failed') {
      return;
    }

    transaction.status = 'pending';
    transaction.error = undefined;
    await this.processQueue();
  }

  /**
   * Retry all failed transactions
   */
  async retryAll(): Promise<void> {
    const failed = this.getFailedTransactions();
    failed.forEach(tx => {
      tx.status = 'pending';
      tx.error = undefined;
    });
    await this.processQueue();
  }

  /**
   * Process queue
   */
  private async processQueue(): Promise<void> {
    if (this.processing || !this.isOnline) {
      return;
    }

    this.processing = true;

    try {
      const pending = this.getPendingTransactions();

      for (const transaction of pending) {
        await this.processTransaction(transaction);
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Process a single transaction
   */
  private async processTransaction(transaction: QueuedTransaction): Promise<void> {
    transaction.status = 'processing';
    transaction.attempts++;
    transaction.lastAttemptAt = new Date();

    try {
      const result = await withRetry(
        transaction.operation,
        transaction.retryOptions
      );

      transaction.status = 'completed';
      transaction.result = result;
    } catch (error) {
      transaction.status = 'failed';
      transaction.error = error instanceof Error ? error : new Error(String(error));
      
      logError(transaction.error, {
        transactionId: transaction.id,
        attempts: transaction.attempts,
      });
    }
  }

  /**
   * Handle online event
   */
  private handleOnline(): void {
    this.isOnline = true;
    console.log('[TransactionQueue] Network online, processing queue');
    this.processQueue();
  }

  /**
   * Handle offline event
   */
  private handleOffline(): void {
    this.isOnline = false;
    console.log('[TransactionQueue] Network offline, pausing queue');
  }

  /**
   * Check if online
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }
}

// Singleton instance
let queueInstance: TransactionQueue | null = null;

/**
 * Get transaction queue instance
 */
export function getTransactionQueue(): TransactionQueue {
  if (!queueInstance) {
    queueInstance = new TransactionQueue();
  }
  return queueInstance;
}

/**
 * Reset transaction queue
 */
export function resetTransactionQueue(): void {
  queueInstance = null;
}

/**
 * Retry-specific error codes
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof StellarError)) {
    return false;
  }

  const retryableCodes = [
    ErrorCode.NETWORK_ERROR,
    ErrorCode.TRANSACTION_FAILED,
  ];

  return retryableCodes.includes(error.code);
}

/**
 * Calculate next retry delay
 */
export function calculateRetryDelay(
  attempt: number,
  options: RetryOptions = {}
): number {
  const config = { ...DEFAULT_RETRY_OPTIONS, ...options };
  return Math.min(
    config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
    config.maxDelay
  );
}
