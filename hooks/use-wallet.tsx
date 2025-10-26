/**
 * Stellar Wallet Hook
 * React hook for managing Stellar wallet connections
 * Handles state, balance updates, and transaction signing
 */

'use client';

import React, { useState, useEffect, useCallback, createContext, useContext } from 'react';
// Use mock until dependencies are installed
import {
  connectFreighter,
  connectAlbedo,
  connectWallet,
  disconnectWallet,
  getAccountBalance,
  signAndSubmitTransaction,
  checkWalletConnection,
  WalletType,
  WalletState,
} from '@/lib/stellar/wallet';
import { toast } from 'sonner';

interface WalletContextType extends WalletState {
  connect: (walletType?: WalletType) => Promise<void>;
  disconnect: () => void;
  refreshBalance: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | null>(null);

export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
  const [walletState, setWalletState] = useState<WalletState>({
    connected: false,
    publicKey: null,
    walletType: null,
    balance: null,
    usdcBalance: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet was previously connected (on mount)
  useEffect(() => {
    const checkPreviousConnection = async () => {
      if (typeof window === 'undefined') return;

      const storedWalletType = localStorage.getItem('stellar_wallet_type') as WalletType | null;
      const storedPublicKey = localStorage.getItem('stellar_public_key');

      if (storedWalletType && storedPublicKey) {
        try {
          const isStillConnected = await checkWalletConnection();
          if (isStillConnected) {
            await handleConnect(storedWalletType);
          } else {
            localStorage.removeItem('stellar_wallet_type');
            localStorage.removeItem('stellar_public_key');
          }
        } catch (error) {
          console.error('Failed to restore wallet connection:', error);
        }
      }
    };

    checkPreviousConnection();
  }, []);

  // Refresh balance periodically
  const refreshBalance = useCallback(async () => {
    if (!walletState.publicKey) return;

    try {
      const { xlm, usdc } = await getAccountBalance(walletState.publicKey);
      setWalletState((prev) => ({
        ...prev,
        balance: xlm,
        usdcBalance: usdc,
      }));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [walletState.publicKey]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!walletState.connected || !walletState.publicKey) return;

    refreshBalance();
    const interval = setInterval(refreshBalance, 30000);

    return () => clearInterval(interval);
  }, [walletState.connected, walletState.publicKey, refreshBalance]);

  const handleConnect = async (walletType: WalletType = 'freighter') => {
    setIsLoading(true);
    setError(null);

    try {
      const publicKey = await connectWallet(walletType);
      
      // Get initial balance
      const { xlm, usdc } = await getAccountBalance(publicKey);

      setWalletState({
        connected: true,
        publicKey,
        walletType,
        balance: xlm,
        usdcBalance: usdc,
      });

      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('stellar_wallet_type', walletType);
        localStorage.setItem('stellar_public_key', publicKey);
      }

      toast.success('Wallet connected successfully!', {
        description: `Connected to ${publicKey.slice(0, 8)}...${publicKey.slice(-8)}`,
      });
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      setError(error.message || 'Failed to connect wallet');
      toast.error('Failed to connect wallet', {
        description: error.message || 'Please try again',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setWalletState({
      connected: false,
      publicKey: null,
      walletType: null,
      balance: null,
      usdcBalance: null,
    });
    setError(null);
    toast.info('Wallet disconnected');
  };

  return (
    <WalletContext.Provider
      value={{
        ...walletState,
        connect: handleConnect,
        disconnect: handleDisconnect,
        refreshBalance,
        isLoading,
        error,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within WalletProvider');
  }
  return context;
};
