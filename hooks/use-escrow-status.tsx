/**
 * Escrow Status Hook
 * Real-time monitoring of escrow status using Horizon streaming and Trustless Work API
 * Provides live updates on funding, milestones, and transaction history
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { getEscrowStatus, getEscrowYield, EscrowStatus } from '@/lib/stellar/trustless-work';
import * as StellarSdk from '@stellar/stellar-sdk';
import { getNetworkConfig } from '@/lib/stellar/config';
import { toast } from 'sonner';

export interface EscrowTransaction {
  id: string;
  type: 'payment' | 'trustline' | 'milestone_release' | 'dispute';
  amount?: string;
  from: string;
  to: string;
  timestamp: Date;
  memo?: string;
  hash: string;
}

export interface UseEscrowStatusOptions {
  escrowId: string;
  pollInterval?: number; // milliseconds, default 10000 (10s)
  enableStreaming?: boolean; // Enable Horizon streaming for real-time updates
}

export interface UseEscrowStatusReturn {
  status: EscrowStatus | null;
  yield: number | null;
  transactions: EscrowTransaction[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  fundingProgress: number; // Percentage (0-100)
  milestoneProgress: number; // Percentage (0-100)
}

/**
 * Hook to monitor escrow status in real-time
 */
export function useEscrowStatus(options: UseEscrowStatusOptions): UseEscrowStatusReturn {
  const { escrowId, pollInterval = 10000, enableStreaming = true } = options;
  
  const [status, setStatus] = useState<EscrowStatus | null>(null);
  const [yieldAmount, setYieldAmount] = useState<number | null>(null);
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch escrow status from Trustless Work API
  const fetchEscrowStatus = useCallback(async () => {
    try {
      setError(null);
      const escrowStatus = await getEscrowStatus(escrowId);
      setStatus(escrowStatus);

      // Fetch yield if escrow is active
      if (escrowStatus.status === 'active') {
        try {
          const yieldData = await getEscrowYield(escrowId);
          setYieldAmount(yieldData.earned);
        } catch (yieldError) {
          console.error('Error fetching yield:', yieldError);
        }
      }
    } catch (err: any) {
      console.error('Error fetching escrow status:', err);
      setError(err.message || 'Failed to fetch escrow status');
    } finally {
      setIsLoading(false);
    }
  }, [escrowId]);

  // Fetch transaction history from Horizon
  const fetchTransactionHistory = useCallback(async (contractAddress: string) => {
    try {
      const config = getNetworkConfig();
      const server = new StellarSdk.Horizon.Server(config.horizonUrl);

      // Get payments to/from the escrow contract
      const payments = await server
        .payments()
        .forAccount(contractAddress)
        .order('desc')
        .limit(50)
        .call();

      const txs: EscrowTransaction[] = await Promise.all(
        payments.records.map(async (payment: any) => {
          // Fetch transaction details for memo
          const txResponse = await payment.transaction();
          
          return {
            id: payment.id,
            type: determineTransactionType(payment, txResponse),
            amount: payment.amount,
            from: payment.from,
            to: payment.to || payment.account,
            timestamp: new Date(payment.created_at),
            memo: txResponse.memo,
            hash: payment.transaction_hash,
          };
        })
      );

      setTransactions(txs);
    } catch (err: any) {
      console.error('Error fetching transaction history:', err);
    }
  }, []);

  // Determine transaction type from payment data
  const determineTransactionType = (payment: any, tx: any): EscrowTransaction['type'] => {
    const memo = tx.memo;
    
    if (memo && memo.includes('milestone')) return 'milestone_release';
    if (memo && memo.includes('dispute')) return 'dispute';
    if (payment.type === 'create_account' || payment.type === 'payment') return 'payment';
    if (payment.type === 'change_trust') return 'trustline';
    
    return 'payment';
  };

  // Refresh all data
  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchEscrowStatus();
    if (status?.contractAddress) {
      await fetchTransactionHistory(status.contractAddress);
    }
  }, [fetchEscrowStatus, fetchTransactionHistory, status]);

  // Initial load
  useEffect(() => {
    fetchEscrowStatus();
  }, [fetchEscrowStatus]);

  // Fetch transactions when status is loaded
  useEffect(() => {
    if (status?.contractAddress) {
      fetchTransactionHistory(status.contractAddress);
    }
  }, [status?.contractAddress, fetchTransactionHistory]);

  // Polling for status updates
  useEffect(() => {
    if (!pollInterval) return;

    const intervalId = setInterval(() => {
      fetchEscrowStatus();
    }, pollInterval);

    return () => clearInterval(intervalId);
  }, [fetchEscrowStatus, pollInterval]);

  // Horizon streaming for real-time updates
  useEffect(() => {
    if (!enableStreaming || !status?.contractAddress) return;

    const config = getNetworkConfig();
    const server = new StellarSdk.Horizon.Server(config.horizonUrl);

    // Stream payments to the escrow account
    const closeStream = server
      .payments()
      .forAccount(status.contractAddress)
      .cursor('now')
      .stream({
        onmessage: async (payment: any) => {
          console.log('New payment detected:', payment);
          
          // Fetch transaction details
          const txResponse = await payment.transaction();
          
          const newTx: EscrowTransaction = {
            id: payment.id,
            type: determineTransactionType(payment, txResponse),
            amount: payment.amount,
            from: payment.from,
            to: payment.to || payment.account,
            timestamp: new Date(payment.created_at),
            memo: txResponse.memo,
            hash: payment.transaction_hash,
          };

          // Add to transactions list
          setTransactions((prev) => [newTx, ...prev]);

          // Refresh escrow status
          await fetchEscrowStatus();

          // Show toast notification
          toast.info('New Transaction', {
            description: `${newTx.type === 'milestone_release' ? 'Milestone released' : 'Payment received'}: ${newTx.amount} ${payment.asset_type === 'native' ? 'XLM' : 'USDC'}`,
          });
        },
        onerror: (error: any) => {
          console.error('Horizon streaming error:', error);
          // Streaming will auto-reconnect
        },
      });

    return () => {
      closeStream();
    };
  }, [status?.contractAddress, enableStreaming, fetchEscrowStatus]);

  // Calculate progress percentages
  const fundingProgress = status
    ? Math.min(100, Math.round((status.totalFunded / status.totalReleased) * 100))
    : 0;

  const milestoneProgress = status
    ? Math.round((status.currentMilestone / (status.currentMilestone + 1)) * 100)
    : 0;

  return {
    status,
    yield: yieldAmount,
    transactions,
    isLoading,
    error,
    refresh,
    fundingProgress,
    milestoneProgress,
  };
}

/**
 * Hook to monitor transaction history for an account
 */
export function useTransactionHistory(publicKey: string | null, limit: number = 20) {
  const [transactions, setTransactions] = useState<EscrowTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async () => {
    if (!publicKey) return;

    setIsLoading(true);
    setError(null);

    try {
      const config = getNetworkConfig();
      const server = new StellarSdk.Horizon.Server(config.horizonUrl);

      const payments = await server
        .payments()
        .forAccount(publicKey)
        .order('desc')
        .limit(limit)
        .call();

      const txs: EscrowTransaction[] = await Promise.all(
        payments.records.map(async (payment: any) => {
          const txResponse = await payment.transaction();
          
          return {
            id: payment.id,
            type: 'payment' as const,
            amount: payment.amount,
            from: payment.from,
            to: payment.to || payment.account,
            timestamp: new Date(payment.created_at),
            memo: txResponse.memo,
            hash: payment.transaction_hash,
          };
        })
      );

      setTransactions(txs);
    } catch (err: any) {
      console.error('Error fetching transactions:', err);
      setError(err.message || 'Failed to fetch transactions');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, limit]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  return {
    transactions,
    isLoading,
    error,
    refresh: fetchTransactions,
  };
}
