/**
 * Storage module exports
 * LocalStorage management for fiat gateway transactions and preferences
 */

export {
  saveFiatTransaction,
  getFiatTransactions,
  getUserPreferences,
  saveUserPreferences,
  updatePreferredAnchor,
  addTransactionToUserHistory,
  addSavedBankAccount,
  removeSavedBankAccount,
  cleanupOldTransactions,
  getTransactionById,
  clearFiatTransactionData,
} from './fiat-transactions';
