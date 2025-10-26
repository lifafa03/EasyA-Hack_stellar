/**
 * LocalStorage management for fiat gateway transactions and user preferences
 * Handles transaction history, user preferences, and automatic cleanup of old records
 */

import {
  FiatTransaction,
  UserFiatPreferences,
  TransactionFilter,
  BankAccountInfo,
} from '../types/fiat-gateway';

// Storage keys
const STORAGE_KEYS = {
  TRANSACTIONS: 'stellar_fiat_transactions',
  PREFERENCES: 'stellar_fiat_preferences',
} as const;

// Constants
const TRANSACTION_RETENTION_DAYS = 90;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/**
 * Save a fiat transaction to localStorage
 * Automatically triggers cleanup of old transactions
 */
export function saveFiatTransaction(transaction: FiatTransaction): void {
  try {
    const transactions = getAllTransactions();
    
    // Check if transaction already exists and update it, otherwise add new
    const existingIndex = transactions.findIndex(tx => tx.id === transaction.id);
    if (existingIndex >= 0) {
      transactions[existingIndex] = transaction;
    } else {
      transactions.push(transaction);
    }
    
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    
    // Cleanup old transactions
    cleanupOldTransactions();
  } catch (error) {
    console.error('Failed to save fiat transaction:', error);
    throw new Error('Failed to save transaction to storage');
  }
}

/**
 * Get fiat transactions with optional filtering
 * @param filter - Optional filter criteria
 * @param userId - Optional user ID to filter by user preferences
 * @returns Array of filtered transactions
 */
export function getFiatTransactions(
  filter?: TransactionFilter,
  userId?: string
): FiatTransaction[] {
  try {
    let transactions = getAllTransactions();
    
    // If userId provided, filter by user's transaction history
    if (userId) {
      const preferences = getUserPreferences(userId);
      if (preferences) {
        const userTxIds = new Set(preferences.transactionHistory.map(tx => tx.id));
        transactions = transactions.filter(tx => userTxIds.has(tx.id));
      }
    }
    
    // Apply filters
    if (filter) {
      transactions = applyFilters(transactions, filter);
    }
    
    // Sort by creation date (newest first)
    transactions.sort((a, b) => b.createdAt - a.createdAt);
    
    return transactions;
  } catch (error) {
    console.error('Failed to get fiat transactions:', error);
    return [];
  }
}

/**
 * Get user preferences for fiat gateway
 * @param userId - User identifier
 * @returns User preferences or null if not found
 */
export function getUserPreferences(userId: string): UserFiatPreferences | null {
  try {
    const preferencesData = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    if (!preferencesData) {
      return null;
    }
    
    const allPreferences: Record<string, UserFiatPreferences> = JSON.parse(preferencesData);
    return allPreferences[userId] || null;
  } catch (error) {
    console.error('Failed to get user preferences:', error);
    return null;
  }
}

/**
 * Save user preferences for fiat gateway
 * @param preferences - User preferences to save
 */
export function saveUserPreferences(preferences: UserFiatPreferences): void {
  try {
    const preferencesData = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    const allPreferences: Record<string, UserFiatPreferences> = preferencesData
      ? JSON.parse(preferencesData)
      : {};
    
    allPreferences[preferences.userId] = preferences;
    
    localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(allPreferences));
  } catch (error) {
    console.error('Failed to save user preferences:', error);
    throw new Error('Failed to save preferences to storage');
  }
}

/**
 * Update user's preferred anchor
 * @param userId - User identifier
 * @param anchorId - Anchor ID to set as preferred
 */
export function updatePreferredAnchor(userId: string, anchorId: string): void {
  const preferences = getUserPreferences(userId) || createDefaultPreferences(userId);
  preferences.preferredAnchor = anchorId;
  saveUserPreferences(preferences);
}

/**
 * Add a transaction to user's history
 * @param userId - User identifier
 * @param transaction - Transaction to add
 */
export function addTransactionToUserHistory(
  userId: string,
  transaction: FiatTransaction
): void {
  const preferences = getUserPreferences(userId) || createDefaultPreferences(userId);
  
  // Check if transaction already exists in history
  const existingIndex = preferences.transactionHistory.findIndex(
    tx => tx.id === transaction.id
  );
  
  if (existingIndex >= 0) {
    preferences.transactionHistory[existingIndex] = transaction;
  } else {
    preferences.transactionHistory.push(transaction);
  }
  
  saveUserPreferences(preferences);
}

/**
 * Add a bank account to user's saved accounts
 * @param userId - User identifier
 * @param bankAccount - Bank account information
 */
export function addSavedBankAccount(
  userId: string,
  bankAccount: BankAccountInfo
): void {
  const preferences = getUserPreferences(userId) || createDefaultPreferences(userId);
  
  // Avoid duplicates (basic check)
  const isDuplicate = preferences.savedBankAccounts.some(
    account => 
      account.accountNumber === bankAccount.accountNumber &&
      account.routingNumber === bankAccount.routingNumber
  );
  
  if (!isDuplicate) {
    preferences.savedBankAccounts.push(bankAccount);
    saveUserPreferences(preferences);
  }
}

/**
 * Remove a bank account from user's saved accounts
 * @param userId - User identifier
 * @param accountIndex - Index of account to remove
 */
export function removeSavedBankAccount(userId: string, accountIndex: number): void {
  const preferences = getUserPreferences(userId);
  if (!preferences) return;
  
  preferences.savedBankAccounts.splice(accountIndex, 1);
  saveUserPreferences(preferences);
}

/**
 * Clean up transactions older than retention period (90 days)
 * Called automatically when saving transactions
 */
export function cleanupOldTransactions(): void {
  try {
    const transactions = getAllTransactions();
    const cutoffDate = Date.now() - (TRANSACTION_RETENTION_DAYS * MS_PER_DAY);
    
    // Keep transactions that are within retention period or still pending
    const filteredTransactions = transactions.filter(tx => {
      const isRecent = tx.createdAt > cutoffDate;
      const isPending = !['completed', 'error', 'expired', 'refunded'].includes(tx.status);
      return isRecent || isPending;
    });
    
    // Only update if we actually removed something
    if (filteredTransactions.length < transactions.length) {
      localStorage.setItem(
        STORAGE_KEYS.TRANSACTIONS,
        JSON.stringify(filteredTransactions)
      );
      
      console.log(
        `Cleaned up ${transactions.length - filteredTransactions.length} old transactions`
      );
    }
  } catch (error) {
    console.error('Failed to cleanup old transactions:', error);
  }
}

/**
 * Get transaction by ID
 * @param transactionId - Transaction ID
 * @returns Transaction or null if not found
 */
export function getTransactionById(transactionId: string): FiatTransaction | null {
  try {
    const transactions = getAllTransactions();
    return transactions.find(tx => tx.id === transactionId) || null;
  } catch (error) {
    console.error('Failed to get transaction by ID:', error);
    return null;
  }
}

/**
 * Clear all fiat transaction data (for testing or user logout)
 * @param userId - Optional user ID to clear only specific user's data
 */
export function clearFiatTransactionData(userId?: string): void {
  try {
    if (userId) {
      // Clear only specific user's preferences
      const preferencesData = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
      if (preferencesData) {
        const allPreferences: Record<string, UserFiatPreferences> = JSON.parse(preferencesData);
        delete allPreferences[userId];
        localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(allPreferences));
      }
    } else {
      // Clear all data
      localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
      localStorage.removeItem(STORAGE_KEYS.PREFERENCES);
    }
  } catch (error) {
    console.error('Failed to clear fiat transaction data:', error);
  }
}

// Helper functions

/**
 * Get all transactions from localStorage
 */
function getAllTransactions(): FiatTransaction[] {
  try {
    const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to parse transactions from localStorage:', error);
    return [];
  }
}

/**
 * Apply filters to transaction array
 */
function applyFilters(
  transactions: FiatTransaction[],
  filter: TransactionFilter
): FiatTransaction[] {
  let filtered = [...transactions];
  
  if (filter.type) {
    filtered = filtered.filter(tx => tx.type === filter.type);
  }
  
  if (filter.status) {
    filtered = filtered.filter(tx => tx.status === filter.status);
  }
  
  if (filter.startDate) {
    filtered = filtered.filter(tx => tx.createdAt >= filter.startDate!);
  }
  
  if (filter.endDate) {
    filtered = filtered.filter(tx => tx.createdAt <= filter.endDate!);
  }
  
  if (filter.anchorId) {
    filtered = filtered.filter(tx => tx.anchorId === filter.anchorId);
  }
  
  return filtered;
}

/**
 * Create default preferences for a new user
 */
function createDefaultPreferences(userId: string): UserFiatPreferences {
  return {
    userId,
    preferredAnchor: '',
    defaultCurrency: 'USD',
    savedBankAccounts: [],
    transactionHistory: [],
  };
}
