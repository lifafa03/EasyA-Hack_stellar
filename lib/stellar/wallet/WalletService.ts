/**
 * Wallet Service
 * Manages wallet connections and provides a unified interface for all wallet providers
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import {
  WalletProvider,
  WalletType,
  WalletState,
  WalletConnection,
  WalletError,
  WalletErrorCode,
} from './types';

/**
 * Event types for wallet state changes
 */
export enum WalletEventType {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ACCOUNT_CHANGED = 'account_changed',
}

export type WalletEventCallback = (event: {
  type: WalletEventType;
  data?: any;
}) => void;

/**
 * WalletService class
 * Manages wallet provider instances and connection state
 */
export class WalletService {
  private state: WalletState = {
    connected: false,
    publicKey: null,
    walletType: null,
    provider: null,
  };

  private providers: Map<WalletType, WalletProvider> = new Map();
  private eventListeners: WalletEventCallback[] = [];

  /**
   * Register a wallet provider
   */
  registerProvider(provider: WalletProvider): void {
    this.providers.set(provider.getWalletType(), provider);
  }

  /**
   * Get all registered providers
   */
  getProviders(): WalletProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get a specific provider by type
   */
  getProvider(walletType: WalletType): WalletProvider | undefined {
    return this.providers.get(walletType);
  }

  /**
   * Get available wallet types (installed and accessible)
   */
  async getAvailableWallets(): Promise<WalletType[]> {
    const available: WalletType[] = [];

    for (const [type, provider] of this.providers.entries()) {
      try {
        const isAvailable = await provider.isAvailable();
        if (isAvailable) {
          available.push(type);
        }
      } catch (error) {
        console.warn(`Failed to check availability for ${type}:`, error);
      }
    }

    return available;
  }

  /**
   * Connect to a wallet
   */
  async connect(walletType: WalletType): Promise<WalletConnection> {
    const provider = this.providers.get(walletType);

    if (!provider) {
      throw new WalletError(
        `Wallet provider ${walletType} not registered`,
        WalletErrorCode.NOT_INSTALLED
      );
    }

    try {
      // Check if wallet is available
      const isAvailable = await provider.isAvailable();
      if (!isAvailable) {
        throw new WalletError(
          `${walletType} wallet is not installed or accessible`,
          WalletErrorCode.NOT_INSTALLED
        );
      }

      // Connect to the wallet
      const publicKey = await provider.connect();

      // Update state
      this.state = {
        connected: true,
        publicKey,
        walletType,
        provider,
      };

      const connection: WalletConnection = {
        publicKey,
        walletType,
        connectedAt: new Date(),
      };

      // Persist connection
      this.persistConnection(connection);

      // Emit connected event
      this.emitEvent({
        type: WalletEventType.CONNECTED,
        data: connection,
      });

      return connection;
    } catch (error: any) {
      // Handle specific error cases
      if (error instanceof WalletError) {
        throw error;
      }

      if (error.message?.includes('rejected') || error.message?.includes('denied')) {
        throw new WalletError(
          'User rejected the connection request',
          WalletErrorCode.USER_REJECTED,
          error
        );
      }

      throw new WalletError(
        `Failed to connect to ${walletType}: ${error.message}`,
        WalletErrorCode.CONNECTION_FAILED,
        error
      );
    }
  }

  /**
   * Disconnect from the current wallet
   */
  async disconnect(): Promise<void> {
    if (!this.state.connected || !this.state.provider) {
      return;
    }

    try {
      await this.state.provider.disconnect();
    } catch (error) {
      console.warn('Error during wallet disconnect:', error);
    }

    // Clear state
    this.state = {
      connected: false,
      publicKey: null,
      walletType: null,
      provider: null,
    };

    // Clear persisted connection
    this.clearPersistedConnection();

    // Emit disconnected event
    this.emitEvent({
      type: WalletEventType.DISCONNECTED,
    });
  }

  /**
   * Sign a transaction with the connected wallet
   */
  async signTransaction(
    transaction: StellarSdk.Transaction,
    networkPassphrase: string
  ): Promise<string> {
    if (!this.state.connected || !this.state.provider) {
      throw new WalletError(
        'No wallet connected',
        WalletErrorCode.NOT_CONNECTED
      );
    }

    try {
      return await this.state.provider.signTransaction(transaction, networkPassphrase);
    } catch (error: any) {
      if (error instanceof WalletError) {
        throw error;
      }

      if (error.message?.includes('rejected') || error.message?.includes('denied')) {
        throw new WalletError(
          'User rejected the transaction',
          WalletErrorCode.USER_REJECTED,
          error
        );
      }

      throw new WalletError(
        `Failed to sign transaction: ${error.message}`,
        WalletErrorCode.SIGNING_FAILED,
        error
      );
    }
  }

  /**
   * Get the current wallet state
   */
  getState(): Readonly<WalletState> {
    return { ...this.state };
  }

  /**
   * Check if a wallet is connected
   */
  isConnected(): boolean {
    return this.state.connected;
  }

  /**
   * Get the connected public key
   */
  getPublicKey(): string | null {
    return this.state.publicKey;
  }

  /**
   * Get the connected wallet type
   */
  getWalletType(): WalletType | null {
    return this.state.walletType;
  }

  /**
   * Subscribe to wallet events
   */
  on(callback: WalletEventCallback): () => void {
    this.eventListeners.push(callback);

    // Return unsubscribe function
    return () => {
      const index = this.eventListeners.indexOf(callback);
      if (index > -1) {
        this.eventListeners.splice(index, 1);
      }
    };
  }

  /**
   * Restore a previous connection from storage
   */
  async restoreConnection(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      const stored = localStorage.getItem('stellar_wallet_connection');
      if (!stored) {
        return false;
      }

      const connection: WalletConnection = JSON.parse(stored);
      const provider = this.providers.get(connection.walletType);

      if (!provider) {
        this.clearPersistedConnection();
        return false;
      }

      // Check if wallet is still available
      const isAvailable = await provider.isAvailable();
      if (!isAvailable) {
        this.clearPersistedConnection();
        return false;
      }

      // Attempt to reconnect
      await this.connect(connection.walletType);
      return true;
    } catch (error) {
      console.warn('Failed to restore wallet connection:', error);
      this.clearPersistedConnection();
      return false;
    }
  }

  /**
   * Emit an event to all listeners
   */
  private emitEvent(event: { type: WalletEventType; data?: any }): void {
    this.eventListeners.forEach((callback) => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in wallet event listener:', error);
      }
    });
  }

  /**
   * Persist connection to localStorage
   */
  private persistConnection(connection: WalletConnection): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.setItem('stellar_wallet_connection', JSON.stringify(connection));
    } catch (error) {
      console.warn('Failed to persist wallet connection:', error);
    }
  }

  /**
   * Clear persisted connection from localStorage
   */
  private clearPersistedConnection(): void {
    if (typeof window === 'undefined') {
      return;
    }

    try {
      localStorage.removeItem('stellar_wallet_connection');
    } catch (error) {
      console.warn('Failed to clear persisted connection:', error);
    }
  }
}
