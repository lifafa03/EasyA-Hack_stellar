/**
 * Stellar Wallet Hook
 * React hook for managing Stellar wallet connections
 * Handles state, balance updates, and transaction signing
 */

'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import {
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
  switchWallet: (walletType: WalletType) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const WalletContext = createContext<WalletContextType | null>(null);

const STORAGE_KEYS = {
  WALLET_TYPE: 'stellar_wallet_type',
  PUBLIC_KEY: 'stellar_public_key',
  CONNECTED_AT: 'stellar_connected_at',
} as const;

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
  const [isInitialized, setIsInitialized] = useState(false);

  // Persist wallet connection to session storage
  const persistConnection = useCallback((walletType: WalletType, publicKey: string) => {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.setItem(STORAGE_KEYS.WALLET_TYPE, walletType);
      sessionStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, publicKey);
      sessionStorage.setItem(STORAGE_KEYS.CONNECTED_AT, new Date().toISOString());
      
      // Also store in localStorage for longer persistence
      localStorage.setItem(STORAGE_KEYS.WALLET_TYPE, walletType);
      localStorage.setItem(STORAGE_KEYS.PUBLIC_KEY, publicKey);
    } catch (error) {
      console.warn('Failed to persist wallet connection:', error);
    }
  }, []);

  // Clear persisted connection
  const clearPersistedConnection = useCallback(() => {
    if (typeof window === 'undefined') return;

    try {
      sessionStorage.removeItem(STORAGE_KEYS.WALLET_TYPE);
      sessionStorage.removeItem(STORAGE_KEYS.PUBLIC_KEY);
      sessionStorage.removeItem(STORAGE_KEYS.CONNECTED_AT);
      localStorage.removeItem(STORAGE_KEYS.WALLET_TYPE);
      localStorage.removeItem(STORAGE_KEYS.PUBLIC_KEY);
    } catch (error) {
      console.warn('Failed to clear persisted connection:', error);
    }
  }, []);

  // Check if wallet was previously connected (on mount)
  useEffect(() => {
    const checkPreviousConnection = async () => {
      if (typeof window === 'undefined') return;

      try {
        // Try session storage first (current session)
        let storedWalletType = sessionStorage.getItem(STORAGE_KEYS.WALLET_TYPE) as WalletType | null;
        let storedPublicKey = sessionStorage.getItem(STORAGE_KEYS.PUBLIC_KEY);

        // Fall back to localStorage if not in session storage
        if (!storedWalletType || !storedPublicKey) {
          storedWalletType = localStorage.getItem(STORAGE_KEYS.WALLET_TYPE) as WalletType | null;
          storedPublicKey = localStorage.getItem(STORAGE_KEYS.PUBLIC_KEY);
        }

        if (storedWalletType && storedPublicKey) {
          // Attempt to reconnect
          await handleConnect(storedWalletType, true);
        }
      } catch (error) {
        console.error('Failed to restore wallet connection:', error);
        clearPersistedConnection();
      } finally {
        setIsInitialized(true);
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
    if (!walletState.connected || !walletState.publicKey || !isInitialized) return;

    refreshBalance();
    const interval = setInterval(refreshBalance, 30000);

    return () => clearInterval(interval);
  }, [walletState.connected, walletState.publicKey, isInitialized, refreshBalance]);

  const handleConnect = async (walletType: WalletType = 'freighter', isReconnecting: boolean = false) => {
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

      // Persist connection
      persistConnection(walletType, publicKey);

      if (!isReconnecting) {
        toast.success('Wallet connected successfully!', {
          description: `Connected to ${publicKey.slice(0, 8)}...${publicKey.slice(-8)}`,
        });
      }
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      setError(error.message || 'Failed to connect wallet');
      
      // Clear persisted connection on error
      clearPersistedConnection();
      
      if (!isReconnecting) {
        toast.error('Failed to connect wallet', {
          description: error.message || 'Please try again',
        });
      }
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    clearPersistedConnection();
    
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

  const handleSwitchWallet = async (walletType: WalletType) => {
    // Disconnect current wallet first
    if (walletState.connected) {
      handleDisconnect();
    }
    
    // Connect to new wallet
    await handleConnect(walletType);
  };

  return (
    <WalletContext.Provider
      value={{
        ...walletState,
        connect: handleConnect,
        disconnect: handleDisconnect,
        switchWallet: handleSwitchWallet,
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

// Export the context for advanced use cases
export { WalletContext };
