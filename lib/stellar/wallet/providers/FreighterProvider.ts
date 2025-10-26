/**
 * Freighter Wallet Provider
 * Implementation for Freighter browser extension wallet
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import {
  isConnected,
  getAddress,
  signTransaction,
  requestAccess,
} from '@stellar/freighter-api';
import { WalletProvider, WalletType, WalletError, WalletErrorCode } from '../types';

/**
 * Freighter wallet provider implementation
 */
export class FreighterProvider implements WalletProvider {
  private publicKey: string | null = null;

  /**
   * Connect to Freighter wallet
   */
  async connect(): Promise<string> {
    try {
      // Check if Freighter is installed
      const available = await this.isAvailable();
      if (!available) {
        throw new WalletError(
          'Freighter wallet is not installed. Please install from https://freighter.app',
          WalletErrorCode.NOT_INSTALLED
        );
      }

      // Request access and get address
      const { address, error } = await requestAccess();

      if (error) {
        if (error.includes('rejected') || error.includes('denied')) {
          throw new WalletError(
            'User rejected the connection request',
            WalletErrorCode.USER_REJECTED,
            error
          );
        }
        throw new WalletError(
          `Freighter error: ${error}`,
          WalletErrorCode.CONNECTION_FAILED,
          error
        );
      }

      if (!address) {
        throw new WalletError(
          'Failed to get address from Freighter',
          WalletErrorCode.CONNECTION_FAILED
        );
      }

      this.publicKey = address;
      return address;
    } catch (error: any) {
      if (error instanceof WalletError) {
        throw error;
      }

      throw new WalletError(
        `Failed to connect to Freighter: ${error.message}`,
        WalletErrorCode.CONNECTION_FAILED,
        error
      );
    }
  }

  /**
   * Disconnect from Freighter wallet
   */
  async disconnect(): Promise<void> {
    this.publicKey = null;
    // Freighter doesn't have an explicit disconnect method
    // Connection state is managed by the extension
  }

  /**
   * Sign a transaction using Freighter
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

      const xdr = transaction.toXDR();

      const { signedTxXdr, error } = await signTransaction(xdr, {
        networkPassphrase,
      });

      if (error) {
        if (error.includes('rejected') || error.includes('denied')) {
          throw new WalletError(
            'User rejected the transaction',
            WalletErrorCode.USER_REJECTED,
            error
          );
        }
        throw new WalletError(
          `Freighter signing error: ${error}`,
          WalletErrorCode.SIGNING_FAILED,
          error
        );
      }

      if (!signedTxXdr) {
        throw new WalletError(
          'Failed to sign transaction',
          WalletErrorCode.SIGNING_FAILED
        );
      }

      return signedTxXdr;
    } catch (error: any) {
      if (error instanceof WalletError) {
        throw error;
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
   * Check if Freighter is available (installed)
   */
  async isAvailable(): Promise<boolean> {
    try {
      const { isConnected: connected } = await isConnected();
      return connected;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the wallet type
   */
  getWalletType(): WalletType {
    return WalletType.FREIGHTER;
  }

  /**
   * Get the current address from Freighter
   * Useful for checking if the user has switched accounts
   */
  async getCurrentAddress(): Promise<string | null> {
    try {
      const { address } = await getAddress();
      return address || null;
    } catch (error) {
      return null;
    }
  }
}
