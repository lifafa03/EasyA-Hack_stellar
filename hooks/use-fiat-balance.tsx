/**
 * Fiat Balance Hook
 * Manages balance updates and pending transaction indicators for fiat gateway
 * Integrates with wallet hook to provide real-time balance updates
 */

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useWallet } from './use-wallet';
import {
  getFiatTransactions,
  saveFiatTransaction,
  addTransactionToUserHistory,
} from '@/lib/stellar/storage/fiat-transactions';
import type { FiatTransaction, TransactionStatus } from '@/lib/stellar/types/fiat-gateway';
import { toast } from 'sonner';

interface PendingTransaction {
  id: string;
  type: 'on-ramp' | 'off-ramp';
  amount: string;
  currency: string;
  status: TransactionStatus;
  createdAt: number;
}

interface UseFiatBalanceReturn {
  // Balance information
  balance: string | null;
  usdcBalance: string | null;
  
  // Pending transactions
  pendingTransactions: PendingTransaction[];
  hasPendingTransactions: boolean;
  pendingOnRampAmount: string;
  pendingOffRampAmount: string;
  
  // Actions
  refreshBalance: () => Promise<void>;
  trackTransaction: (transaction: FiatTransaction) => void;
  updateTransactionStatus: (transactionId: string, status: TransactionStatus) => void;
  
  // Loading states
  isRefreshing: boolean;
}

/**
 * Hook for managing fiat balance updates and pending transaction tracking
 */
export function useFiatBalance(): UseFiatBalanceReturn {
  const wallet = useWallet();
  const [pendingTransactions, setPendingTransactions] = useState<PendingTransaction[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const lastBalanceRef = useRef<string | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load pending transactions from storage
  const loadPendingTransactions = useCallback(() => {
    if (!wallet.publicKey) {
      setPendingTransactions([]);
      return;
    }

    try {
      const allTransactions = getFiatTransactions(
        {
          status: ['pending_user_transfer_start', 'pending_anchor', 'pending_stellar', 'pending_external'],
        },
        wallet.publicKey
      );

      const pending: PendingTransaction[] = allTransactions.map(tx => ({
        id: tx.id,
        type: tx.type,
        amount: tx.type === 'on-ramp' ? tx.cryptoAmount : tx.amount,
        currency: tx.type === 'on-ramp' ? tx.cryptoCurrency : tx.currency,
        status: tx.status,
        createdAt: tx.createdAt,
      }));

      setPendingTransactions(pending);
    } catch (error) {
      console.error('Failed to load pending transactions:', error);
      setPendingTransactions([]);
    }
  }, [wallet.publicKey]);

  // Load pending transactions on mount and when wallet changes
  useEffect(() => {
    loadPendingTransactions();
  }, [loadPendingTransactions]);

  // Calculate total pending amounts
  const pendingOnRampAmount = pendingTransactions
    .filter(tx => tx.type === 'on-ramp')
    .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0)
    .toFixed(2);

  const pendingOffRampAmount = pendingTransactions
    .filter(tx => tx.type === 'off-ramp')
    .reduce((sum, tx) => sum + parseFloat(tx.amount || '0'), 0)
    .toFixed(2);

  // Refresh balance with loading state
  const refreshBalance = useCallback(async () => {
    if (!wallet.connected || !wallet.publicKey) {
      return;
    }

    setIsRefreshing(true);
    try {
      await wallet.refreshBalance();
      
      // Check if balance changed significantly (completed transaction)
      const currentBalance = wallet.usdcBalance;
      if (lastBalanceRef.current && currentBalance !== lastBalanceRef.current) {
        const diff = parseFloat(currentBalance || '0') - parseFloat(lastBalanceRef.current || '0');
        
        if (Math.abs(diff) > 0.01) {
          // Balance changed, reload pending transactions
          loadPendingTransactions();
          
          // Show notification
          if (diff > 0) {
            toast.success('Balance updated', {
              description: `+${diff.toFixed(2)} USDC received`,
            });
          }
        }
      }
      
      lastBalanceRef.current = currentBalance;
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    } finally {
      setIsRefreshing(false);
    }
  }, [wallet, loadPendingTransactions]);

  // Track a new transaction
  const trackTransaction = useCallback((transaction: FiatTransaction) => {
    if (!wallet.publicKey) {
      console.warn('Cannot track transaction: wallet not connected');
      return;
    }

    try {
      // Save transaction to storage
      saveFiatTransaction(transaction);
      
      // Add to user's transaction history
      addTransactionToUserHistory(wallet.publicKey, transaction);
      
      // Reload pending transactions
      loadPendingTransactions();
      
      // If transaction is completed, refresh balance
      if (transaction.status === 'completed') {
        refreshBalance();
      }
    } catch (error) {
      console.error('Failed to track transaction:', error);
    }
  }, [wallet.publicKey, loadPendingTransactions, refreshBalance]);

  // Update transaction status
  const updateTransactionStatus = useCallback((
    transactionId: string,
    status: TransactionStatus
  ) => {
    if (!wallet.publicKey) {
      return;
    }

    try {
      // Get all transactions
      const allTransactions = getFiatTransactions(undefined, wallet.publicKey);
      const transaction = allTransactions.find(tx => tx.id === transactionId);
      
      if (!transaction) {
        console.warn(`Transaction ${transactionId} not found`);
        return;
      }

      // Update transaction
      const updatedTransaction: FiatTransaction = {
        ...transaction,
        status,
        completedAt: status === 'completed' ? Date.now() : transaction.completedAt,
      };

      // Save updated transaction
      saveFiatTransaction(updatedTransaction);
      
      // Reload pending transactions
      loadPendingTransactions();
      
      // If completed, refresh balance
      if (status === 'completed') {
        toast.success('Transaction completed!');
        refreshBalance();
      } else if (status === 'error') {
        toast.error('Transaction failed');
      }
    } catch (error) {
      console.error('Failed to update transaction status:', error);
    }
  }, [wallet.publicKey, loadPendingTransactions, refreshBalance]);

  // Poll for balance updates when there are pending transactions
  useEffect(() => {
    if (pendingTransactions.length > 0 && wallet.connected) {
      // Poll every 30 seconds
      pollingIntervalRef.current = setInterval(() => {
        refreshBalance();
      }, 30000);

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
        }
      };
    }
  }, [pendingTransactions.length, wallet.connected, refreshBalance]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  return {
    balance: wallet.balance,
    usdcBalance: wallet.usdcBalance,
    pendingTransactions,
    hasPendingTransactions: pendingTransactions.length > 0,
    pendingOnRampAmount,
    pendingOffRampAmount,
    refreshBalance,
    trackTransaction,
    updateTransactionStatus,
    isRefreshing,
  };
}
