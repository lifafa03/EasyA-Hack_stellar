/**
 * Stellar Wallets Kit Hook
 * React hook for managing Stellar wallet connections using @creit.tech/stellar-wallets-kit
 */

'use client';

import { useState, useEffect, useCallback, createContext, useContext, useRef } from 'react';
import { StellarWalletsKit } from '@creit.tech/stellar-wallets-kit';
import { getWalletKit, walletKitConfig, getPublicKey } from '@/lib/stellar/wallet-kit';
import { getAccountBalance } from '@/lib/stellar/wallet';
import { toast } from 'sonner';

interface WalletKitState {
  connected: boolean;
  publicKey: string | null;
  balance: string | null;
  usdcBalance: string | null;
  kit: StellarWalletsKit | null;
  walletType: string | null;
}

interface WalletKitContextType extends WalletKitState {
  openModal: () => void;
  disconnect: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  isLoading: boolean;
}

const WalletKitContext = createContext<WalletKitContextType | null>(null);

const STORAGE_KEY = 'stellar_wallet_kit_connected';

export const WalletKitProvider = ({ children }: { children: React.ReactNode }) => {
  const [state, setState] = useState<WalletKitState>({
    connected: false,
    publicKey: null,
    balance: null,
    usdcBalance: null,
    kit: null,
    walletType: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const kitRef = useRef<StellarWalletsKit | null>(null);
  const isInitialized = useRef(false);

  // Initialize the kit
  useEffect(() => {
    if (typeof window === 'undefined' || isInitialized.current) return;

    try {
      const kit = getWalletKit();
      kitRef.current = kit;
      setState((prev) => ({ ...prev, kit }));
      isInitialized.current = true;

      // Try to restore previous connection
      const wasConnected = localStorage.getItem(STORAGE_KEY);
      if (wasConnected === 'true') {
        handleReconnect(kit);
      }
    } catch (error) {
      console.error('Failed to initialize wallet kit:', error);
    }
  }, []);

  // Reconnect to previously connected wallet
  const handleReconnect = async (kit: StellarWalletsKit) => {
    try {
      const publicKey = await getPublicKey(kit);
      if (publicKey) {
        await updateWalletState(publicKey);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (error) {
      console.error('Failed to reconnect wallet:', error);
      localStorage.removeItem(STORAGE_KEY);
    }
  };

  // Update wallet state with balance
  const updateWalletState = async (publicKey: string) => {
    try {
      const { xlm, usdc } = await getAccountBalance(publicKey);
      setState((prev) => ({
        ...prev,
        connected: true,
        publicKey,
        balance: xlm,
        usdcBalance: usdc,
      }));
      localStorage.setItem(STORAGE_KEY, 'true');
      
      // Show helpful message if account is unfunded
      if (xlm === '0' && usdc === '0') {
        toast.info('Account needs funding', {
          description: 'Get free testnet XLM from Stellar Laboratory to start using the platform',
          duration: 5000,
        });
      }
    } catch (error) {
      console.error('Failed to fetch balance:', error);
      setState((prev) => ({
        ...prev,
        connected: true,
        publicKey,
        balance: '0',
        usdcBalance: '0',
      }));
    }
  };

  // Open the wallet modal
  const openModal = useCallback(async () => {
    if (!kitRef.current) {
      toast.error('Wallet kit not initialized');
      return;
    }

    setIsLoading(true);
    try {
      await kitRef.current.openModal({
        onWalletSelected: async (option) => {
          try {
            kitRef.current?.setWallet(option.id);
            const publicKey = await getPublicKey(kitRef.current!);
            
            if (publicKey) {
              // Store wallet type (convert to lowercase for compatibility)
              const walletType = option.id.toLowerCase().replace('_', '');
              setState((prev) => ({ ...prev, walletType }));
              
              await updateWalletState(publicKey);
              toast.success('Wallet connected!', {
                description: `${publicKey.slice(0, 8)}...${publicKey.slice(-8)}`,
              });
            }
          } catch (error: any) {
            console.error('Wallet connection error:', error);
            toast.error('Failed to connect wallet', {
              description: error.message || 'Please try again',
            });
          }
        },
        onClosed: () => {
          setIsLoading(false);
        },
      });
    } catch (error: any) {
      console.error('Failed to open modal:', error);
      toast.error('Failed to open wallet modal');
      setIsLoading(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    setState({
      connected: false,
      publicKey: null,
      balance: null,
      usdcBalance: null,
      kit: kitRef.current,
      walletType: null,
    });
    localStorage.removeItem(STORAGE_KEY);
    toast.info('Wallet disconnected');
  }, []);

  // Refresh balance
  const refreshBalance = useCallback(async () => {
    if (!state.publicKey) return;

    try {
      const { xlm, usdc } = await getAccountBalance(state.publicKey);
      setState((prev) => ({
        ...prev,
        balance: xlm,
        usdcBalance: usdc,
      }));
    } catch (error) {
      console.error('Failed to refresh balance:', error);
    }
  }, [state.publicKey]);

  // Auto-refresh balance every 30 seconds
  useEffect(() => {
    if (!state.connected || !state.publicKey) return;

    refreshBalance();
    const interval = setInterval(refreshBalance, 30000);

    return () => clearInterval(interval);
  }, [state.connected, state.publicKey, refreshBalance]);

  return (
    <WalletKitContext.Provider
      value={{
        ...state,
        openModal,
        disconnect,
        refreshBalance,
        isLoading,
      }}
    >
      {children}
    </WalletKitContext.Provider>
  );
};

export const useWalletKit = () => {
  const context = useContext(WalletKitContext);
  if (!context) {
    throw new Error('useWalletKit must be used within WalletKitProvider');
  }
  return context;
};

export { WalletKitContext };
