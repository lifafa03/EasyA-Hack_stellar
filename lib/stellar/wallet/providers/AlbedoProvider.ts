/**
 * Albedo Wallet Provider
 * Implementation for Albedo web-based wallet
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { WalletProvider, WalletType, WalletError, WalletErrorCode } from '../types';

/**
 * Albedo interface (loaded from external script)
 */
interface AlbedoSDK {
  publicKey(params?: any): Promise<{ pubkey: string }>;
  tx(params: { xdr: string; network?: string }): Promise<{ signed_envelope_xdr: string }>;
  implicitFlow(params: any): Promise<any>;
}

declare global {
  interface Window {
    albedo?: AlbedoSDK;
  }
}

/**
 * Albedo wallet provider implementation
 */
export class AlbedoProvider implements WalletProvider {
  private publicKey: string | null = null;

  /**
   * Connect to Albedo wallet
   */
  async connect(): Promise<string> {
    try {
      // Check if Albedo is available
      const available = await this.isAvailable();
      if (!available) {
        throw new WalletError(
          'Albedo wallet not found. Please visit https://albedo.link',
          WalletErrorCode.NOT_INSTALLED
        );
      }

      // Request public key from Albedo
      const result = await window.albedo!.publicKey({});

      if (!result.pubkey) {
        throw new WalletError(
          'Failed to get public key from Albedo',
          WalletErrorCode.CONNECTION_FAILED
        );
      }

      this.publicKey = result.pubkey;
      return result.pubkey;
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
        `Failed to connect to Albedo: ${error.message}`,
        WalletErrorCode.CONNECTION_FAILED,
        error
      );
    }
  }

  /**
   * Disconnect from Albedo wallet
   */
  async disconnect(): Promise<void> {
    this.publicKey = null;
    // Albedo doesn't maintain persistent connection state
    // Each operation requires user approval
  }

  /**
   * Sign a transaction using Albedo
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

      if (!window.albedo) {
        throw new WalletError(
          'Albedo wallet not available',
          WalletErrorCode.NOT_INSTALLED
        );
      }

      const xdr = transaction.toXDR();

      // Determine network parameter for Albedo
      const network = networkPassphrase.includes('Test') ? 'testnet' : 'public';

      const result = await window.albedo.tx({
        xdr,
        network,
      });

      if (!result.signed_envelope_xdr) {
        throw new WalletError(
          'Failed to sign transaction',
          WalletErrorCode.SIGNING_FAILED
        );
      }

      return result.signed_envelope_xdr;
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
   * Check if Albedo is available
   */
  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    // Albedo is loaded via script tag, check if it's available
    if (window.albedo) {
      return true;
    }

    // Try to load Albedo dynamically
    return this.loadAlbedoSDK();
  }

  /**
   * Get the wallet type
   */
  getWalletType(): WalletType {
    return WalletType.ALBEDO;
  }

  /**
   * Load Albedo SDK dynamically
   */
  private async loadAlbedoSDK(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    // Check if already loaded
    if (window.albedo) {
      return true;
    }

    try {
      // Load Albedo SDK from CDN
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/@albedo-link/intent@latest/lib/albedo.intent.js';
      script.async = true;

      const loadPromise = new Promise<boolean>((resolve) => {
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
      });

      document.head.appendChild(script);

      return await loadPromise;
    } catch (error) {
      console.warn('Failed to load Albedo SDK:', error);
      return false;
    }
  }
}
