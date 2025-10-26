/**
 * Lobstr Wallet Provider
 * Implementation for Lobstr wallet using WalletConnect
 */

import * as StellarSdk from '@stellar/stellar-sdk';
import { WalletProvider, WalletType, WalletError, WalletErrorCode } from '../types';

/**
 * Lobstr wallet provider implementation
 * Uses the Stellar Wallets Kit for WalletConnect integration
 */
export class LobstrProvider implements WalletProvider {
  private publicKey: string | null = null;
  private walletKit: any = null;

  /**
   * Connect to Lobstr wallet via WalletConnect
   */
  async connect(): Promise<string> {
    try {
      // Check if wallet kit is available
      const available = await this.isAvailable();
      if (!available) {
        throw new WalletError(
          'Lobstr wallet connection not available. Please ensure you have the Lobstr app installed.',
          WalletErrorCode.NOT_INSTALLED
        );
      }

      // Initialize WalletConnect for Lobstr
      // Using @creit.tech/stellar-wallets-kit if available
      if (typeof window !== 'undefined') {
        try {
          // Dynamic import to avoid SSR issues
          const { StellarWalletsKit, WalletNetwork, WalletType: KitWalletType } = await import(
            '@creit.tech/stellar-wallets-kit'
          );

          this.walletKit = new StellarWalletsKit({
            network: WalletNetwork.TESTNET, // This should be configurable
            selectedWalletId: KitWalletType.LOBSTR,
          });

          await this.walletKit.openModal({
            onWalletSelected: async (option: any) => {
              this.walletKit.setWallet(option.id);
            },
          });

          const { address } = await this.walletKit.getAddress();

          if (!address) {
            throw new WalletError(
              'Failed to get address from Lobstr',
              WalletErrorCode.CONNECTION_FAILED
            );
          }

          this.publicKey = address;
          return address;
        } catch (error: any) {
          // If stellar-wallets-kit is not available, provide fallback
          if (error.message?.includes('Cannot find module')) {
            throw new WalletError(
              'Lobstr wallet integration requires @creit.tech/stellar-wallets-kit package',
              WalletErrorCode.NOT_INSTALLED,
              error
            );
          }
          throw error;
        }
      }

      throw new WalletError(
        'Lobstr wallet can only be used in browser environment',
        WalletErrorCode.CONNECTION_FAILED
      );
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
        `Failed to connect to Lobstr: ${error.message}`,
        WalletErrorCode.CONNECTION_FAILED,
        error
      );
    }
  }

  /**
   * Disconnect from Lobstr wallet
   */
  async disconnect(): Promise<void> {
    try {
      if (this.walletKit) {
        // Close WalletConnect session
        await this.walletKit.disconnect();
      }
    } catch (error) {
      console.warn('Error disconnecting from Lobstr:', error);
    } finally {
      this.publicKey = null;
      this.walletKit = null;
    }
  }

  /**
   * Sign a transaction using Lobstr
   */
  async signTransaction(
    transaction: StellarSdk.Transaction,
    networkPassphrase: string
  ): Promise<string> {
    try {
      if (!this.publicKey || !this.walletKit) {
        throw new WalletError(
          'Wallet not connected',
          WalletErrorCode.NOT_CONNECTED
        );
      }

      const xdr = transaction.toXDR();

      const { signedTxXdr } = await this.walletKit.sign({
        xdr,
        publicKey: this.publicKey,
        network: networkPassphrase,
      });

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
   * Check if Lobstr is available
   */
  async isAvailable(): Promise<boolean> {
    if (typeof window === 'undefined') {
      return false;
    }

    try {
      // Check if stellar-wallets-kit is available
      await import('@creit.tech/stellar-wallets-kit');
      return true;
    } catch (error) {
      // Package not installed, but Lobstr could still work with direct integration
      // For now, return false to indicate the recommended integration is not available
      return false;
    }
  }

  /**
   * Get the wallet type
   */
  getWalletType(): WalletType {
    return WalletType.LOBSTR;
  }
}
