/**
 * xBull Wallet Provider
 * Implementation for xBull wallet
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { WalletProvider, WalletType, WalletError, WalletErrorCode } from '../types';

/**
 * xBull SDK interface
 */
interface xBullSDK {
  connect(params?: any): Promise<{ publicKey: string }>;
  sign(params: { xdr: string; publicKey: string; network: string }): Promise<{ response: string }>;
  disconnect(): Promise<void>;
  isAvailable(): boolean;
}

declare global {
  interface Window {
    xBullSDK?: xBullSDK;
  }
}

/**
 * xBull wallet provider implementation
 */
export class xBullProvider implements WalletProvider {
  private publicKey: string | null = null;

  /**
   * Connect to xBull wallet
   */
  async connect(): Promise<string> {
    try {
      // Check if xBull is available
      const available = await this.isAvailable();
      if (!available) {
        throw new WalletError(
          'xBull wallet not found. Please install from https://xbull.app',
          WalletErrorCode.NOT_INSTALLED
        );
      }

      // Connect to xBull
      const result = await window.xBullSDK!.connect();

      if (!result.publicKey) {
        throw new WalletError(
          'Failed to get public key from xBull',
          WalletErrorCode.CONNECTION_FAILED
        );
      }

      this.publicKey = result.publicKey;
      return result.publicKey;
    } catch (error: any) {
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
        `Failed to connect to xBull: ${error.message}`,
        WalletErrorCode.CONNECTION_FAILED,
        error
      );
    }
  }

  /**
   * Disconnect from xBull wallet
   */
  async disconnect(): Promise<void> {
    try {
      if (window.xBullSDK) {
        await window.xBullSDK.disconnect();
      }
    } catch (error) {
      console.warn('Error disconnecting from xBull:', error);
    } finally {
      this.publicKey = null;
    }
  }

  /**
   * Sign a transaction using xBull
   */
  async signTransaction(
    transaction: StellarSdk.Transaction,
    networkPassphrase: string
  ): Promise<string> {
    try {
      if (!this.publicKey) {
        throw new WalletError(
          'Wallet not connected',
          WalletErrorCode.NOT_CONNECTED
        );
      }

      if (!window.xBullSDK) {
        throw new WalletError(
          'xBull wallet not available',
          WalletErrorCode.NOT_INSTALLED
        );
      }

      const xdr = transaction.toXDR();

      // Determine network parameter for xBull
      const network = networkPassphrase.includes('Test') ? 'TESTNET' : 'PUBLIC';

      const result = await window.xBullSDK.sign({
        xdr,
        publicKey: this.publicKey,
        network,
      });

      if (!result.response) {
        throw new WalletError(
          'Failed to sign transaction',
          WalletErrorCode.SIGNING_FAILED
        );
      }

      return result.response;
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
   * Get the currently connected public key
   */
  getPublicKey(): string | null {
    return this.publicKey;
  }

  /**
   * Check if xBull is available
   */
  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    // Check if xBull SDK is available
    if (window.xBullSDK && window.xBullSDK.isAvailable()) {
      return true;
    }

    // Try to load xBull SDK dynamically
    return this.loadxBullSDK();
  }

  /**
   * Get the wallet type
   */
  getWalletType(): WalletType {
    return WalletType.XBULL;
  }

  /**
   * Load xBull SDK dynamically
   */
  private async loadxBullSDK(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    // Check if already loaded
    if (window.xBullSDK) {
      return true;
    }

    try {
      // xBull is typically loaded as a browser extension
      // Check if the extension injected the SDK
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (window.xBullSDK && window.xBullSDK.isAvailable()) {
        return true;
      }

      // If not available after waiting, it's not installed
      return false;
    } catch (error) {
      console.warn('Failed to detect xBull SDK:', error);
      return false;
    }
  }
}
